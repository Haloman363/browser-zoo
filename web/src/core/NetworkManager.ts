import { Peer, DataConnection } from 'peerjs';
import { NetworkPacket, validateNetworkPacket } from '../utils/validators';

export type { NetworkPacket } from '../utils/validators';

export class NetworkManager {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private isHost: boolean = false;
    private onPacket: (packet: NetworkPacket) => void = () => {};
    private onConnected: (id: string) => void = () => {};
    private onDisconnected: () => void = () => {};
    
    // Rate limiting to prevent DoS
    private packetTimestamps: number[] = [];
    private readonly MAX_PACKETS_PER_SECOND = 50;

    constructor() {}

    public async hostGame(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.peer = new Peer();
            this.peer.on('open', (id) => {
                console.log(`[Network] Hosting game with ID: ${id}`);
                this.isHost = true;
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                console.log(`[Network] Incoming connection from ${conn.peer}`);
                this.handleConnection(conn);
            });

            this.peer.on('error', (err) => reject(err));
        });
    }

    public async joinGame(hostId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.peer = new Peer();
            this.peer.on('open', () => {
                console.log(`[Network] Connecting to host: ${hostId}`);
                const conn = this.peer!.connect(hostId);
                this.handleConnection(conn);
                conn.on('open', () => resolve());
            });

            this.peer.on('error', (err) => reject(err));
        });
    }
    
    /**
     * Rate limit check to prevent DoS attacks
     */
    private checkRateLimit(): boolean {
        const now = Date.now();
        // Remove timestamps older than 1 second
        this.packetTimestamps = this.packetTimestamps.filter(t => now - t < 1000);
        
        if (this.packetTimestamps.length >= this.MAX_PACKETS_PER_SECOND) {
            console.warn('[Network] Rate limit exceeded');
            return false;
        }
        
        this.packetTimestamps.push(now);
        return true;
    }

    private handleConnection(conn: DataConnection) {
        this.connection = conn;
        
        conn.on('open', () => {
            console.log(`[Network] Connected to ${conn.peer}`);
            this.onConnected(conn.peer);
        });

        conn.on('data', (data) => {
            // Rate limiting
            if (!this.checkRateLimit()) {
                return;
            }
            
            // Validate packet before processing
            const validated = validateNetworkPacket(data);
            if (validated) {
                this.onPacket(validated);
            } else {
                console.error('[Network] Received invalid packet, ignoring');
            }
        });

        conn.on('close', () => {
            console.log('[Network] Connection closed');
            this.onDisconnected();
            this.connection = null;
        });

        conn.on('error', (err) => console.error('[Network] Connection Error:', err));
    }

    public send(packet: NetworkPacket) {
        if (this.connection && this.connection.open) {
            // Validate before sending
            const validated = validateNetworkPacket(packet);
            if (validated) {
                this.connection.send(validated);
            } else {
                console.error('[Network] Attempted to send invalid packet');
            }
        }
    }

    public isHosting() { return this.isHost; }
    public isConnected() { return !!this.connection && this.connection.open; }

    public on(event: 'packet', cb: (packet: NetworkPacket) => void): void;
    public on(event: 'connected', cb: (id: string) => void): void;
    public on(event: 'disconnected', cb: () => void): void;
    public on(event: string, cb: any) {
        if (event === 'packet') this.onPacket = cb;
        if (event === 'connected') this.onConnected = cb;
        if (event === 'disconnected') this.onDisconnected = cb;
    }
    
    /**
     * Cleanup method to prevent memory leaks
     */
    public destroy() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.isHost = false;
    }
}
