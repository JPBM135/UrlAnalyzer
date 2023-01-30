import { checkRateLimit } from '@functions/ratelimit/checkRateLimit.js';
import { HttpError } from '@structures/httpError.js';
import { errorResponse } from '@utils/respond.js';
import type { NextFunction, Request, Response } from 'express';

export function commonFunctionsMiddleware() {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const ratelimit = await checkRateLimit(req.ip, req.url.split('/')?.[0] ?? 'root', null);

			for (const header of Object.keys(ratelimit.headers)) {
				res.setHeader(header, String(ratelimit.headers[header]));
			}

			if (ratelimit.error) {
				throw ratelimit.error;
			}

			next();
			return;
		} catch (error) {
			errorResponse(HttpError.fromError(error as Error), res);
		}
	};
}
