import console from "console";
import {Serializer} from "@greymass/eosio";
import {WebSocket, WebSocketServer} from "ws";
import {MockChain} from "./chain.js";
import {DEFAULT_ABI_STRING} from "./utils.js";

export class ShipSocket {
    private chain: MockChain;
    private chainWss: WebSocketServer;
    private port: number;
    private isListening: boolean = false;

    constructor(chain: MockChain, port: number) {
        this.chain = chain;
        this.port = port;
    }

    getPort(): number {
        return this.port;
    }

    listen() {
        if (this.isListening)
            throw new Error('socket already listening');

        this.chainWss = new WebSocketServer({port: this.port});
        this.chainWss.on('listening', (ws) => {
            this.isListening = true;
        });
        this.chainWss.on('close', (ws) => {
            this.isListening = false;
        });
        this.chainWss.on('connection', (ws) => {
            const sessionId = this.chain.initializeShipSession(ws);
            ws.on('disconnect', async () => {
                await this.chain.stopSession(sessionId);
            });
            ws.on('message', async (message) => {
                const request = Serializer.decode({type: "request", abi: this.chain.shipAbi, data: message as Buffer});
                const requestType = request[0];
                const requestData = Serializer.objectify(request[1]);

                switch (requestType) {
                    case "get_blocks_request_v0":
                        this.chain.sessionGetBlocks(sessionId, requestData);
                        break;

                    case "get_status_request_v0":
                        const statusResponse = Serializer.encode({
                            type: "result",
                            abi: this.chain.shipAbi,
                            object: ["get_status_result_v0", this.chain.generateStatusResponse()]
                        }).array;
                        ws.send(statusResponse);
                        break;

                    case "get_blocks_ack_request_v0":
                        this.chain.sessionAckBlocks(sessionId, requestData.num_messages);
                        break;
                    default:
                        console.warn(`unhandled type: ${requestType}`);
                        break;
                }
            });
            ws.send(DEFAULT_ABI_STRING);
        });
    }

    async close(): Promise<void> {
        if (!this.isListening)
            throw new Error('socket not listening');

        this.chainWss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        return new Promise((resolve, reject) => {
            this.chainWss.close((error) => {
                if (error) {
                    console.error('Error closing WebSocket server:', error);
                    reject(error);
                } else {
                    console.log('WebSocket server closed');
                    resolve();
                }
            });
        });
    }
}
