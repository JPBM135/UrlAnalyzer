import type { RawUrlAnalysis } from '@types';
import type { Sql } from 'postgres';
import { kSQL } from 'tokens.js';
import { container } from 'tsyringe';

export async function createUrlAnalysis(
	data: Omit<RawUrlAnalysis, 'created_at' | 'updated_at'>,
): Promise<RawUrlAnalysis> {
	const sql = container.resolve<Sql<any>>(kSQL);

	const query: Omit<RawUrlAnalysis, 'created_at' | 'updated_at'> = {
		id: data.id,
		owner_id: data.owner_id,
		body: data.body,
		certificate_id: data.certificate_id,
		contacted_domains: data.contacted_domains,
		dns: data.dns,
		console_output: data.console_output,
		cookies: data.cookies,
		effective_url: data.effective_url,
		metadata: data.metadata,
		requests_ids: data.requests_ids,
		screenshot: data.screenshot,
		security_details: data.security_details,
		urls_found: data.urls_found,
		url: data.url,
		lh_report: data.lh_report,
	};

	const [result] = await sql<[RawUrlAnalysis]>`
		insert into url_analysis ${sql(query as Record<string, unknown>, ...Object.keys(query))}
		returning *
	`;

	return result;
}
