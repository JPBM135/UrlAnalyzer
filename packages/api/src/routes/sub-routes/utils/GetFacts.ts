import { HttpError } from '@structures/httpError.js';
import type { GETUtilsFactsEndpointReturn } from '@types';
import { CacheType, errorResponse, sendResponse } from '@utils/respond.js';
import { AllFacts } from 'constants.js';
import type { Request, Response } from 'express';

export async function factsHandler(_: Request, res: Response): Promise<void> {
	try {
		sendResponse<GETUtilsFactsEndpointReturn>(AllFacts, res, CacheType.Gigantic);
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
