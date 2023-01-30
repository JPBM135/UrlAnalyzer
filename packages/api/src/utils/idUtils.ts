import { Snowflake } from '@sapphire/snowflake';
import { URL_SCAN_EPOCH } from '../constants.js';

const snowflake = new Snowflake(URL_SCAN_EPOCH);

export function generateSnowflake(processId = 1): string {
	return snowflake
		.generate({
			processId: BigInt(processId),
		})
		.toString();
}

export function generateCompoundSnowflake(processId = 1, amount = 2): string {
	const snowflakes = [];

	for (let idx = 0n; idx < BigInt(amount); idx++) {
		snowflakes.push(
			snowflake
				.generate({
					processId: BigInt(processId),
					workerId: idx,
				})
				.toString(),
		);
	}

	return snowflakes.join('-');
}

console.log(generateSnowflake());
console.log(generateSnowflake(2));
console.log(generateCompoundSnowflake());
console.log(generateCompoundSnowflake(2));
console.log(generateCompoundSnowflake(2, 3));
console.log(generateCompoundSnowflake(2, 4));
