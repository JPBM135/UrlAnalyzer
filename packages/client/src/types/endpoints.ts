import type { SafeSession } from './database.js';
import type { HttpErrorCodes, HttpStatusCode } from './errorCodes.js';
import type { If } from './utils.js';

// General
export interface ErrorBody {
	code: HttpErrorCodes;
	description: HttpErrorCodes | string;
	message: HttpStatusCode;
	status: HttpStatusCode;
}

export interface GeneralEndpointReturn<T, M = 'error' | 'success'> {
	data: If<M, 'success', T>;
	error?: If<M, 'error', ErrorBody>;
	message: M;
}

export interface GeneralPaginatedEndpointReturn<T, M = 'error' | 'success'> extends GeneralEndpointReturn<T, M> {
	data: If<M, 'success', T>;
	error?: If<M, 'error', ErrorBody>;
	message: M;
	next: If<M, 'success', string | null>;
	totalCount: If<M, 'success', number>;
}

export type GETOAuth2AuthorizeEndpointReturn = GeneralEndpointReturn<
	{
		discord: string;
		github: string;
		google: string;
		microsoft: string;
	},
	'success'
>;

export type POSTAuthLoginEndpointReturn = GeneralEndpointReturn<SafeSession>;
export interface POSTAuthLoginEndpointBody {
	email: string;
	password: string;
}
