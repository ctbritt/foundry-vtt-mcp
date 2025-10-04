import { RTCPeerConnection, RTCSessionDescription } from 'werift';
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
export class WebRTCPeer {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: any = null;
  private logger: Logger;
  private config: Config['foundry']['webrtc'];
  private onMessageHandler: (message: any) => Promise<void>;
  private isConnected = false;

  constructor({ config, logger, onMessage }: WebRTCPeerOptions) {
    this.config = config;
    this.logger = logger.child({ component: 'WebRTCPeer' });
    this.onMessageHandler = onMessage;
  }

  /**
   * Handle incoming WebRTC offer from browser client
   * Returns answer to be sent back to client
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.logger.info('Received WebRTC offer from client');

    // Create peer connection with STUN servers
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.stunServers.map(url => ({ urls: url }))
    });

    this.setupPeerConnectionHandlers();

    // Set remote description (offer from client)
    await this.peerConnection.setRemoteDescription(offer as any);

    // Wait for data channel from client
    await this.waitForDataChannel();

    // Create answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Wait for ICE gathering to complete
    await this.waitForIceGathering();

    this.logger.info('Created WebRTC answer');
    return this.peerConnection.localDescription as RTCSessionDescriptionInit;
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.iceConnectionStateChange.subscribe((state) => {
      this.logger.info(`ICE connection state: ${state}`);

      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        this.isConnected = false;
      }
    });

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      this.logger.info(`Peer connection state: ${state}`);

      if (state === 'connected') {
        this.isConnected = true;
      } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        this.isConnected = false;
      }
    };

    this.peerConnection.ondatachannel = (event: any) => {
      this.logger.info('Data channel received from client');
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };
  }

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.logger.info('WebRTC data channel opened');
      this.isConnected = true;
    };

    this.dataChannel.onclose = () => {
      this.logger.info('WebRTC data channel closed');
      this.isConnected = false;
    };

    this.dataChannel.onerror = (error: any) => {
      this.logger.error('WebRTC data channel error', error);
    };

    this.dataChannel.onmessage = async (event: any) => {
      try {
        const message = JSON.parse(event.data);
        this.logger.debug('Received WebRTC message', { type: message.type });
        await this.onMessageHandler(message);
      } catch (error) {
        this.logger.error('Failed to parse WebRTC message', error);
      }
    };
  }

  private async waitForDataChannel(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Data channel timeout'));
      }, 10000);

      if (this.dataChannel) {
        clearTimeout(timeout);
        resolve();
        return;
      }

      const checkDataChannel = setInterval(() => {
        if (this.dataChannel) {
          clearTimeout(timeout);
          clearInterval(checkDataChannel);
          resolve();
        }
      }, 100);
    });
  }

  private async waitForIceGathering(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ICE gathering timeout'));
      }, 10000);

      if (this.peerConnection?.iceGatheringState === 'complete') {
        clearTimeout(timeout);
        resolve();
        return;
      }

      this.peerConnection!.iceGatheringStateChange.subscribe((state) => {
        if (state === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  sendMessage(message: any): void {
    if (!this.dataChannel || !this.isConnected) {
      this.logger.warn('Cannot send message - data channel not open');
      return;
    }

    try {
      this.dataChannel.send(JSON.stringify(message));
      this.logger.debug('Sent WebRTC message', { type: message.type });
    } catch (error) {
      this.logger.error('Failed to send WebRTC message', error);
    }
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.isConnected = false;
    this.logger.info('WebRTC peer disconnected');
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
