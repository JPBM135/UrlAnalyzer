import { HttpError } from '@structures/httpError.js';
import UrlAnalysis from '@structures/urlAnalysis.js';
import type { POSTScanResultEndpointReturn } from '@types';
import { HttpStatusCode } from '@types';
import { errorResponse, sendResponse } from '@utils/respond.js';
import type { Request, Response } from 'express';

export async function scanHandlerHandler(req: Request, res: Response): Promise<void> {
	try {
		const { url } = req.body;

		if (!url) {
			throw new HttpError(HttpStatusCode.BadRequest, 'ValidationFailed', 'Missing URL');
		}

		const analysis = new UrlAnalysis(url);

		void analysis.navigate();

		sendResponse<POSTScanResultEndpointReturn>(
			{
				id: analysis.id,
			},
			res,
		);
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
