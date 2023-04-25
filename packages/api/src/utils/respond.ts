import type { HttpError } from '@structures/httpError.js';
import type { Response } from 'express';
import logger from '../logger.js';

export enum CacheType {
	Gigantic = 'public, max-age=1800, immutable',
	Long = 'public, max-age=300, immutable',
	NoStore = 'no-store',
	Short = 'public, max-age=5, immutable',
}

export function sendNonDataResponse(res: Response, cache = CacheType.Short) {
	try {
		res.set('Cache-Control', cache).sendStatus(204).end();
	} catch (error) {
		logger.error('Error sending non-data response: ' + (error as Error).message, error);
	}
}

export function sendResponse<T extends { data: unknown; message: string }>(
	data: T['data'],
	res: Response,
	cache = CacheType.Short,
) {
	try {
		res
			.set('Cache-Control', cache)
			.json({
				message: 'success',
				data,
				error: null,
			})
			.end();
	} catch (error) {
		logger.error('Error sending response: ' + (error as Error).message, error);
	}
}

export function errorResponse(error: HttpError, res: Response, cache = CacheType.NoStore) {
	try {
		res
			.set('Cache-Control', cache)
			.status(error.status)
			.json({
				message: 'error',
				data: null,
				error: error.json,
			})
			.end();
	} catch (error) {
		logger.error('Error sending error response: ' + (error as Error).message, error);
	}
}
