import { createOAuthConnection } from '@database/oauth_connections/createOAuthConnection.js';
import { createSession } from '@database/session/createSession.js';
import { createUser } from '@database/users/createUser.js';
import { getUserByEmail } from '@database/users/getUser.js';
import { HttpError } from '@structures/httpError.js';
import { resolveEnv } from '@utils/resolveEnv.js';
import { errorResponse, sendResponse } from '@utils/respond.js';
import { Providers } from 'constants.js';
import type { Request, Response } from 'express';
import { google } from 'googleapis';

export async function googleOAuthCallbackHandler(req: Request, res: Response): Promise<void> {
	try {
		const { code } = req.query;

		console.log(req.query);

		if (typeof code !== 'string') {
			throw new HttpError(400, 'BadRequest', 'Invalid code');
		}

		const oauth2Client = new google.auth.OAuth2(
			resolveEnv('GOOGLE_OAUTH_CLIENT_ID'),
			resolveEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
			resolveEnv('GOOGLE_REDIRECT_URI'),
		);

		const { tokens } = await oauth2Client.getToken(code);

		if (!tokens) {
			throw new HttpError(400, 'BadRequest', 'Invalid code');
		}

		console.log(tokens);

		oauth2Client.setCredentials(tokens);

		console.log(oauth2Client.credentials);

		const oauth2 = google.oauth2({
			auth: oauth2Client,
			version: 'v2',
		});

		const { data } = await oauth2.userinfo.get();

		const user =
			(await getUserByEmail(data.email!)) ??
			(await createUser({
				email: data.email!,
				name: data.name!,
			}));

		const [session] = await Promise.all([
			createSession({ user_id: user.id }),
			createOAuthConnection({
				access_token: tokens.access_token!,
				expires_at: new Date(tokens.expiry_date!),
				provider: Providers.Google,
				provider_user_id: data.id!,
				refresh_token: tokens.refresh_token!,
				scopes: tokens.scope!.split(' '),
				user_id: user.id,
			}),
		]);

		sendResponse<any>(session, res);
	} catch (error) {
		errorResponse(HttpError.fromError(error as Error), res);
	}
}
