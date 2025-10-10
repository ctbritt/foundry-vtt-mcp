import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { WebRTCPeer } from './webrtc-peer.js';
export class FoundryConnector {
    wss = null;
    httpServer;
    webrtcSignalingServer; // Separate HTTP server for WebRTC signaling
    logger;
    config;
    isStarted = false;
    foundrySocket = null;
    webrtcPeer = null;
    activeConnectionType = null;
    pendingQueries = new Map();
    queryIdCounter = 0;
    constructor({ config, logger }) {
        this.config = config;
        this.logger = logger.child({ component: 'FoundryConnector' });
    }
    async start() {
        if (this.isStarted) {
            this.logger.debug('Foundry connector already started');
            return;
        }
        this.logger.info('Starting Foundry connector WebSocket server', {
            port: this.config.port,
            protocol: this.config.protocol || 'ws',
            remoteMode: this.config.remoteMode || false
        });
        // Create HTTP server for WebSocket connections
        this.httpServer = createServer((req, res) => {
            res.writeHead(404);
            res.end();
        });
        // Create SEPARATE HTTP server for WebRTC signaling (port 31416)
        const WEBRTC_PORT = 31416;
        this.webrtcSignalingServer = createServer(async (req, res) => {
            // Set CORS headers for all requests
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            // Handle OPTIONS preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }
            // Only handle POST to /webrtc-offer
            if (req.method === 'POST' && req.url === '/webrtc-offer') {
                try {
                    await this.handleWebRTCOfferHTTP(req, res);
                }
                catch (error) {
                    this.logger.error('WebRTC offer handling failed', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal server error' }));
                }
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        // Start WebRTC signaling server
        await new Promise((resolve, reject) => {
            this.webrtcSignalingServer.listen(WEBRTC_PORT, '0.0.0.0', () => {
                this.logger.info(`WebRTC signaling server listening on port ${WEBRTC_PORT}`);
                console.error(`[WebRTC] Server started on 0.0.0.0:${WEBRTC_PORT}`);
                resolve();
            });
            this.webrtcSignalingServer.on('error', (error) => {
                this.logger.error('Failed to start WebRTC signaling server', error);
                console.error(`[WebRTC] Server error:`, error);
                reject(error);
            });
        });
        // Create WebSocket server in noServer mode to avoid request consumption
        this.wss = new WebSocketServer({ noServer: true });
        // Manually handle upgrade for WebSocket connections
        this.httpServer.on('upgrade', (req, socket, head) => {
            const pathname = req.url || '/';
            // Only upgrade if path matches WebSocket namespace
            if (pathname === (this.config.namespace || '/')) {
                this.wss?.handleUpgrade(req, socket, head, (ws) => {
                    this.wss?.emit('connection', ws, req);
                });
            }
            else {
                socket.destroy();
            }
        });
        // Handle WebSocket connections (both signaling and direct WebSocket)
        this.wss.on('connection', (ws) => {
            this.logger.info('Client connected via WebSocket');
            ws.on('close', () => {
                this.logger.info('Client disconnected');
                if (this.activeConnectionType === 'websocket') {
                    this.foundrySocket = null;
                    this.activeConnectionType = null;
                    // Reject all pending queries
                    this.pendingQueries.forEach(({ reject, timeout }) => {
                        clearTimeout(timeout);
                        reject(new Error('Connection closed'));
                    });
                    this.pendingQueries.clear();
                }
            });
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    // Check if this is WebRTC signaling
                    if (message.type === 'webrtc-offer') {
                        await this.handleWebRTCOffer(message.offer, ws);
                    }
                    else {
                        // Regular WebSocket message
                        if (!this.foundrySocket) {
                            this.foundrySocket = ws;
                            this.activeConnectionType = 'websocket';
                            this.logger.info('Foundry module connected via WebSocket (direct)');
                        }
                        await this.handleMessage(message);
                    }
                }
                catch (error) {
                    this.logger.error('Failed to parse message', error);
                }
            });
            ws.on('error', (error) => {
                this.logger.error('WebSocket error', error);
            });
        });
        // Start the HTTP server
        await new Promise((resolve, reject) => {
            this.httpServer.listen(this.config.port, () => {
                this.isStarted = true;
                this.logger.info('Foundry connector listening', { port: this.config.port });
                resolve();
            });
            this.httpServer.on('error', (error) => {
                this.logger.error('Failed to start Foundry connector', error);
                reject(error);
            });
        });
    }
    async stop() {
        if (!this.isStarted) {
            return;
        }
        this.logger.info('Stopping Foundry connector...');
        // Reject all pending queries
        this.pendingQueries.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(new Error('Server shutting down'));
        });
        this.pendingQueries.clear();
        if (this.foundrySocket) {
            this.foundrySocket.close();
            this.foundrySocket = null;
        }
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        if (this.httpServer) {
            await new Promise((resolve) => {
                this.httpServer.close(() => {
                    resolve();
                });
            });
            this.httpServer = null;
        }
        this.isStarted = false;
        this.logger.info('Foundry connector stopped');
    }
    async handleMessage(message) {
        if (message.type === 'mcp-response' && message.id) {
            const pending = this.pendingQueries.get(message.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingQueries.delete(message.id);
                if (message.data.success) {
                    this.logger.debug('Query response received', { id: message.id, hasData: !!message.data.data });
                    pending.resolve(message.data.data);
                }
                else {
                    this.logger.error('Query failed', { id: message.id, error: message.data.error });
                    pending.reject(new Error(message.data.error || 'Query failed'));
                }
            }
            return;
        }
        if (message.type === 'pong') {
            const pending = this.pendingQueries.get(message.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingQueries.delete(message.id);
                pending.resolve(message.data);
            }
            return;
        }
        const comfyHandlers = globalThis.backendComfyUIHandlers;
        if (comfyHandlers?.handleMessage) {
            this.logger.debug('Routing message to backend ComfyUI handlers', { type: message.type });
            try {
                await comfyHandlers.handleMessage(message);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error('Failed to forward message to backendComfyUIHandlers', {
                    type: message.type,
                    error: errorMessage
                });
            }
            return;
        }
        this.logger.debug('Received unknown message type', { type: message.type });
    }
    async handleWebRTCOffer(offer, signalingWs) {
        try {
            this.logger.info('Handling WebRTC offer for signaling');
            // Create WebRTC peer
            this.webrtcPeer = new WebRTCPeer({
                config: this.config.webrtc,
                logger: this.logger,
                onMessage: this.handleMessage.bind(this)
            });
            // Handle offer and get answer
            const answer = await this.webrtcPeer.handleOffer(offer);
            // Send answer back via signaling WebSocket
            signalingWs.send(JSON.stringify({
                type: 'webrtc-answer',
                answer: answer
            }));
            this.activeConnectionType = 'webrtc';
            this.logger.info('WebRTC connection established');
            // Close signaling WebSocket after handshake
            setTimeout(() => {
                signalingWs.close();
            }, 1000);
        }
        catch (error) {
            this.logger.error('Failed to handle WebRTC offer', error);
            signalingWs.send(JSON.stringify({
                type: 'webrtc-error',
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }
    async handleWebRTCOfferHTTP(req, res) {
        // CRITICAL: Call resume() to enable stream data flow
        req.resume();
        try {
            // Read body using promise wrapper around classic events
            const body = await new Promise((resolve, reject) => {
                const chunks = [];
                req.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                req.on('end', () => {
                    resolve(Buffer.concat(chunks).toString());
                });
                req.on('error', reject);
            });
            const { offer } = JSON.parse(body);
            if (!offer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing offer in request body' }));
                return;
            }
            // Create WebRTC peer
            this.webrtcPeer = new WebRTCPeer({
                config: this.config.webrtc,
                logger: this.logger,
                onMessage: this.handleMessage.bind(this)
            });
            // Handle offer and get answer
            const answer = await this.webrtcPeer.handleOffer(offer);
            this.activeConnectionType = 'webrtc';
            this.logger.info('WebRTC connection established via HTTP signaling');
            // Send answer back via HTTP response
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ answer }));
        }
        catch (error) {
            this.logger.error('Failed to handle WebRTC offer via HTTP', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }
    async query(method, data) {
        // Check connection based on active connection type
        const isConnected = this.activeConnectionType === 'webrtc'
            ? (this.webrtcPeer && this.webrtcPeer.getIsConnected())
            : (this.foundrySocket && this.foundrySocket.readyState === WebSocket.OPEN);
        if (!isConnected) {
            throw new Error('Not connected to Foundry VTT module');
        }
        const queryId = `query-${++this.queryIdCounter}`;
        this.logger.debug('Sending query to Foundry', { method, data, queryId, connectionType: this.activeConnectionType });
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingQueries.delete(queryId);
                reject(new Error(`Query timeout: ${method}`));
            }, 10000); // 10 second timeout
            this.pendingQueries.set(queryId, { resolve, reject, timeout });
            const message = {
                type: 'mcp-query',
                id: queryId,
                data: { method, data }
            };
            // Use sendToFoundry to support both WebSocket and WebRTC
            this.sendToFoundry(message);
        });
    }
    sendToFoundry(message) {
        if (this.activeConnectionType === 'webrtc' && this.webrtcPeer) {
            this.webrtcPeer.sendMessage(message);
        }
        else if (this.activeConnectionType === 'websocket' && this.foundrySocket && this.foundrySocket.readyState === WebSocket.OPEN) {
            this.foundrySocket.send(JSON.stringify(message));
        }
        else {
            throw new Error('Not connected to Foundry VTT module');
        }
    }
    isConnected() {
        if (!this.isStarted)
            return false;
        if (this.activeConnectionType === 'webrtc') {
            return this.webrtcPeer !== null && this.webrtcPeer.getIsConnected();
        }
        else if (this.activeConnectionType === 'websocket') {
            return this.foundrySocket !== null && this.foundrySocket.readyState === WebSocket.OPEN;
        }
        return false;
    }
    getConnectionInfo() {
        return {
            started: this.isStarted,
            connected: this.isConnected(),
            connectionType: this.activeConnectionType,
            readyState: this.foundrySocket?.readyState || 'CLOSED',
            config: {
                port: this.config.port,
                namespace: this.config.namespace
            }
        };
    }
    getConnectionType() {
        return this.activeConnectionType;
    }
    /**
     * Send a message to the connected Foundry module
     */
    sendMessage(message) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Foundry VTT module');
        }
        try {
            this.sendToFoundry(message);
            this.logger.debug('Sent message to Foundry module', { type: message.type, connectionType: this.activeConnectionType });
        }
        catch (error) {
            this.logger.error('Failed to send message to Foundry module', error);
            throw error;
        }
    }
    /**
     * Broadcast a message to all connected Foundry clients (alias for sendMessage for single connection)
     */
    broadcastMessage(message) {
        this.sendMessage(message);
    }
}
//# sourceMappingURL=foundry-connector.js.map