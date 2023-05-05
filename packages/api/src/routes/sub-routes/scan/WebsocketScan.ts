import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import { HttpError } from '@structures/httpError.js';
import { HttpStatusCode } from '@types';
import { globToRegex } from '@utils/globToRegex.js';
import { errorResponse } from '@utils/respond.js';
import { validateId } from '@utils/validators.js';
import { OP_DELIMITER } from 'constants.js';
import type { Request, Response } from 'express';
import type { Redis } from 'ioredis';
import logger from 'logger.js';
import { kRedis, kWebSockets } from 'tokens.js';
import { container } from 'tsyringe';
import type { WebSocket, WebSocketServer } from 'ws';

const SCAN_WEBSOCKET_PATH_REGEX = globToRegex('/api/v1/scan/*/ws');

export async function scanGetWebsocketHandler(req: Request, res: Response): Promise<void> {
	const wss = container.resolve<WebSocketServer>(kWebSockets);
	const redis = container.resolve<Redis>(kRedis);

	try {
		logger.debug('(GET) Connection received', {
			ip: req.socket.remoteAddress,
		});

		if (!req.url?.match(SCAN_WEBSOCKET_PATH_REGEX)) {
			throw new HttpError(HttpStatusCode.NotFound, 'RouteNotFound');
		}

		const scan_id = req.url.replace('/api/v1/scan/', '').replace('/ws', '');

		if (!scan_id) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Missing scan ID');
		}

		if (!validateId(scan_id)) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Invalid scan ID');
		}

		const exists = await redis.exists(`url_analysis${OP_DELIMITER}${scan_id}`);

		if (!exists) {
			throw new HttpError(HttpStatusCode.NotFound, 'NotFound', "Scan not found or can't be connected to");
		}

		wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
			logger.info(`(GET) Client connected to scan ${scan_id}`, {
				ip: req.socket.remoteAddress,
			});
			wss.emit(`connection:${scan_id}`, ws, req);
		});
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}

export async function scanWebsocketHandler(ws: WebSocket, req: IncomingMessage): Promise<void> {
	const redis = container.resolve<Redis>(kRedis);

	try {
		logger.debug('(WSS) Connection received', {
			ip: req.socket.remoteAddress,
		});

		if (!req.url?.match(SCAN_WEBSOCKET_PATH_REGEX)) {
			throw new HttpError(HttpStatusCode.NotFound, 'RouteNotFound');
		}

		const scan_id = req.url.replace('/api/v1/scan/', '').replace('/ws', '');

		if (!scan_id) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Missing scan ID');
		}

		if (!validateId(scan_id)) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Invalid scan ID');
		}

		const exists = await redis.exists(`url_analysis${OP_DELIMITER}${scan_id}`);

		if (!exists) {
			throw new HttpError(HttpStatusCode.NotFound, 'NotFound', "Scan not found or can't be connected to");
		}

		const server = container.resolve<WebSocketServer>(kWebSockets);

		logger.info(`(WSS) Client connected to scan ${scan_id}`, {
			ip: req.socket.remoteAddress,
		});

		server.emit(`connection:${scan_id}`, ws, req);
	} catch (error) {
		if (error instanceof HttpError) {
			ws.close(1_008, JSON.stringify(error.json));
		} else {
			ws.close(1_011, JSON.stringify(HttpError.fromError(error as Error).json));
		}
	}
}
