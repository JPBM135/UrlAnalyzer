import { getScan } from '@database/scans/getScan.js';
import { HttpError } from '@structures/httpError.js';
import UrlAnalysis from '@structures/urlAnalysis.js';
import type { GETScanEndpointReturn } from '@types';
import { HttpStatusCode } from '@types';
import { errorResponse, sendResponse } from '@utils/respond.js';
import type { Request, Response } from 'express';
import { kCache } from 'tokens.js';
import { container } from 'tsyringe';
import type { InternalCache } from 'types/types.js';

export async function getScanHandler(req: Request, res: Response): Promise<void> {
	try {
		const { scan_id } = req.params;

		if (!scan_id) {
			throw new HttpError(HttpStatusCode.BadRequest, 'MissingParameters', 'Missing ID');
		}

		const cache = container.resolve<InternalCache>(kCache);

		const result = cache.get(scan_id);

		if (result) {
			if (result.ok) {
				sendResponse<GETScanEndpointReturn>(result.data!, res);
			} else {
				throw new HttpError(HttpStatusCode.BadRequest, 'NavigationFailed', result.error);
			}

			return;
		}

		const dbResult = await getScan(scan_id);

		if (!dbResult) {
			throw new HttpError(HttpStatusCode.NotFound, 'NotFound', 'Analysis not found');
		}

		sendResponse<GETScanEndpointReturn>(await UrlAnalysis.createFromDbResult(dbResult), res);
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
