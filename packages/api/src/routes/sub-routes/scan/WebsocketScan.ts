import { Buffer } from 'node:buffer';
import { HttpError } from '@structures/httpError.js';
import { HttpStatusCode } from '@types';
import { errorResponse } from '@utils/respond.js';
import { OP_DELIMITER } from 'constants.js';
import type { Request, Response } from 'express';
import type { Redis } from 'ioredis';
import { kRedis, kWebSockets } from 'tokens.js';
import { container } from 'tsyringe';
import type { WebSocketServer } from 'ws';

export async function scanWebsocketHandler(req: Request, res: Response): Promise<void> {
	const redis = container.resolve<Redis>(kRedis);

	try {
		const { scan_id } = req.params;

		if (!scan_id) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Missing scan ID');
		}

		const exists = await redis.exists(`url_analysis${OP_DELIMITER}${scan_id}`);

		if (!exists) {
			throw new HttpError(HttpStatusCode.NotFound, 'NotFound', "Scan not found or can't be connected to");
		}

		const server = container.resolve<WebSocketServer>(kWebSockets);

		server.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
			server.emit(`connection:${scan_id}`, ws, req);
		});
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
