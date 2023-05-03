import type { Server } from 'node:https';
import process from 'node:process';
import { scanWebsocketHandler } from 'routes/sub-routes/scan/WebsocketScan.js';
import { kHttpServer, kHttpsServer, kWebSockets } from 'tokens.js';
import { container } from 'tsyringe';
import { WebSocketServer } from 'ws';

const isProd = process.env.NODE_ENV === 'production';

export function createWebsocketServer() {
	const server = container.resolve<Server>(isProd ? kHttpsServer : kHttpServer);

	const webSocketServer = new WebSocketServer({
		server,
	});

	webSocketServer.on('connection', scanWebsocketHandler);

	container.register(kWebSockets, { useValue: webSocketServer });
}
