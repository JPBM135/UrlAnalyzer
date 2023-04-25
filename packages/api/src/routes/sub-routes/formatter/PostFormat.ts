import { getResponse } from '@database/responses/getResponse.js';
import { HttpError } from '@structures/httpError.js';
import type { POSTFormatBodyEndpointReturn } from '@types';
import { HttpStatusCode } from '@types';
import { findFormatter } from '@utils/formatBody.js';
import { errorResponse, sendResponse } from '@utils/respond.js';
import type { Request, Response } from 'express';

export async function formatHandler(req: Request, res: Response): Promise<void> {
	try {
		const { body, resource_type, id } = req.body;

		if (!body && !id) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Missing body or id');
		}

		if (body && id) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Cannot have both body and id');
		}

		if (!resource_type) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Missing resource_type');
		}

		const response = id ? await getResponse(id) : null;

		if (id && !response) {
			throw new HttpError(HttpStatusCode.NotFound, 'NotFound', 'Response not found');
		}

		sendResponse<POSTFormatBodyEndpointReturn>(findFormatter(response?.body ?? body, resource_type), res);
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
