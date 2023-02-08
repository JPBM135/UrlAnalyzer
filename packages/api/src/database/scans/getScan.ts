import type { RawUrlAnalysis } from '@types';
import type { Sql } from 'postgres';
import { kSQL } from 'tokens.js';
import { container } from 'tsyringe';

export async function getScan(scan_id: string): Promise<RawUrlAnalysis> {
	const sql = container.resolve<Sql<any>>(kSQL);

	const [result] = await sql<[RawUrlAnalysis]>`
		select * from url_analysis where id = ${scan_id}
	`;

	return result;
}
