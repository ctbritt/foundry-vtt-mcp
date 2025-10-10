import { Logger } from './logger.js';
import type { Config } from './config.js';
export interface WebRTCPeerOptions {
    config: Config['foundry']['webrtc'];
    logger: Logger;
    onMessage: (message: any) => Promise<void>;
}
/**
 * WebRTC peer connection for Node.js server
 * Handles WebRTC signaling and data channel communication
 */
export declare class WebRTCPeer {
    private peerConnection;
    private dataChannel;
    private logger;
    private config;
    private onMessageHandler;
    private isConnected;
    constructor({ config, logger, onMessage }: WebRTCPeerOptions);
    /**
     * Handle incoming WebRTC offer from browser client
     * Returns answer to be sent back to client
     *
     * Critical: Send answer IMMEDIATELY, then trickle ICE candidates
     * Don't wait for data channel or ICE gathering before answering
     */
    handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    private setupPeerConnectionHandlers;
    private setupDataChannelHandlers;
    sendMessage(message: any): void;
    disconnect(): void;
    getIsConnected(): boolean;
}
