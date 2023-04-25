import type { RawRequest } from '@types';
import { generateSnowflake } from '@utils/idUtils.js';
import { databaseSanitize } from '@utils/sanitize.js';
import { OP_DELIMITER, TableWorkerIdentifiers } from 'constants.js';
import type { Sql } from 'postgres';
import type { Protocol } from 'puppeteer';
import { kSQL } from 'tokens.js';
import { container } from 'tsyringe';

export async function createRequest(
	data: Omit<RawRequest, 'created_at' | 'initiator' | 'updated_at'> & {
		initiator?: Protocol.Network.Initiator;
	},
): Promise<RawRequest> {
	const sql = container.resolve<Sql<any>>(kSQL);

	const query: Omit<RawRequest, 'created_at' | 'updated_at'> = databaseSanitize({
		id: `${data.id}${OP_DELIMITER}${generateSnowflake(TableWorkerIdentifiers.Request)}`,
		parent_id: data.parent_id,
		initiator: data.initiator ?? ({} as Protocol.Network.Initiator),
		post_data: data.post_data ?? null,
		redirect_chain: data.redirect_chain,
		resource_type: data.resource_type,
		response_id: data.response_id,
		nonce: data.nonce,
		headers: data.headers,
		method: data.method,
		url: data.url,
	});

	const [result] = await sql<[RawRequest]>`
		insert into requests ${sql(query as Record<string, unknown>, ...Object.keys(query))}
		returning *
	`;

	return result;
}
