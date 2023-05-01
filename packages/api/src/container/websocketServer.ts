import { kWebSockets } from 'tokens.js';
import { container } from 'tsyringe';
import { WebSocketServer } from 'ws';

export function createWebsocketServer() {
	const webSocketServer = new WebSocketServer({
		noServer: true,
	});

	container.register(kWebSockets, { useValue: webSocketServer });
}
