import type { HttpError } from '@structures/httpError.js';
import type { Response } from 'express';
import logger from '../logger.js';

export function sendNonDataResponse(res: Response) {
	try {
		res.sendStatus(204).end();
	} catch (error) {
		logger.error('Error sending non-data response: ' + (error as Error).message, error);
	}
}

export function sendResponse<T>(data: T, res: Response<T>) {
	try {
		res
			.json({
				...data,
				error: null,
			})
			.end();
	} catch (error) {
		logger.error('Error sending response: ' + (error as Error).message, error);
	}
}

export function errorResponse(error: HttpError, res: Response) {
	try {
		res
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
