import { Peer, DataConnection } from 'peerjs';

export type NetworkPacket = 
    | { type: 'hello', name: string }
    | { type: 'world_state', data: any }
    | { type: 'action', action: string, data: any }
    | { type: 'chat', message: string, sender: string };

export class NetworkManager {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private isHost: boolean = false;
    private onPacket: (packet: NetworkPacket) => void = () => {};
    private onConnected: (id: string) => void = () => {};
    private onDisconnected: () => void = () => {};

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

    private handleConnection(conn: DataConnection) {
        this.connection = conn;
        
        conn.on('open', () => {
            console.log(`[Network] Connected to ${conn.peer}`);
            this.onConnected(conn.peer);
        });

        conn.on('data', (data) => {
            // Check packet type or handle raw data
            this.onPacket(data as NetworkPacket);
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
            this.connection.send(packet);
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
}
