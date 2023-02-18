import 'reflect-metadata';
import { expect, it } from 'vitest';
import { type ConditionReturn, parseCondition, matchConditions } from '../src/functions/iok/conditionParser.js';
import { matchCheckRule } from '../src/functions/iok/matchResult.js';
import { parseIOKRule, parseLocalIOKRules } from '../src/functions/iok/parseIOKRules.js';

const exampleData = `
title: Netflix Phishing Kit - 191636
description: |
  Netflix phishing kit cloned from the legitimate netflix.com login page using a web page scraper tool.

  The kit was first detected on October 10th, and was designed to steal user credentials by posting them to a PHP script located on a remote server.

  The kit closely mimics the design and functionality of the official Netflix login page, and is designed to trick unsuspecting users into entering their login credentials.
  references:

  https://www.bleepingcomputer.com/news/security/netflix-phishing-kit-spoofs-real-login-page-to-steal-credentials/
detection:
  scrapeDate:
    html|contains|all:
      - '<meta name="scrape-date" content="Mon Oct 10 2022 15:45:20 GMT-0400'
      - '<meta name="scrape-url" content="https://www.netflix.com/login">'

  scrapeUrl:
    html|re:
      - '<form method="post" action="https://example.com/.+">'

  input:
    html|contains: <input type="submit" value="Sign In">

  dummy:
    html|contains: <nah>

  condition: scrapeDate and scrapeUrl and (input or dummy)

tags:
  - kit
  - target.netflix`;

const exampleMatch = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="scrape-date" content="Mon Oct 10 2022 15:45:20 GMT-0400">
  <meta name="scrape-url" content="https://www.netflix.com/login">
  <title>Netflix Login</title>
</head>
<body>
  <h1>Sign In</h1>
  <form method="post" action="https://example.com/post.php">
    <label for="email">Email</label>
    <input type="email" name="email" id="email">
    <br>
    <label for="password">Password</label>
    <input type="password" name="password" id="password">
    <br>
    <input type="submit" value="Sign In">
  </form>
</body>
</html>`;

it('Should parse a valid iok file', async () => {
	const parsed = parseLocalIOKRules();

	const resolved = await parsed;

	expect(resolved).toBeInstanceOf(Array);
	expect(resolved).length.greaterThan(0);
});

it('Should parse simple conditions', () => {
	const condition = 'one and two and three';

	expect(parseCondition(condition)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [/^one$/, /^two$/, /^three$/],
	});

	const condition2 = 'one or two or three';

	expect(parseCondition(condition2)).toEqual<ConditionReturn>({
		type: 'or',
		conditions: [/^one$/, /^two$/, /^three$/],
	});

	const nestedCondition = 'one and (two or three)';

	expect(parseCondition(nestedCondition)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [
			{
				type: 'or',
				conditions: [/^two$/, /^three$/],
			},
			/^one$/,
		],
	});
});

it('Should parse complex conditions', () => {
	const nestedCondition2 = 'one and (two or three) and four';

	expect(parseCondition(nestedCondition2)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [
			{
				type: 'or',
				conditions: [/^two$/, /^three$/],
			},
			/^one$/,
			/^four$/,
		],
	});

	const doubleNestedCondition = '(one and two) or (three and four)';

	expect(parseCondition(doubleNestedCondition)).toEqual<ConditionReturn>({
		type: 'or',
		conditions: [
			{
				type: 'and',
				conditions: [/^one$/, /^two$/],
			},
			{
				type: 'and',
				conditions: [/^three$/, /^four$/],
			},
		],
	});
});

it('Should parse glob conditions', () => {
	const globCondition = 'one and two and *.js';

	expect(parseCondition(globCondition)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [/^one$/, /^two$/, /^.*\.js$/],
	});

	const globCondition2 = 'one and per*';

	expect(parseCondition(globCondition2)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [/^one$/, /^per.*$/],
	});
});

it('Should parse glob conditions with nested conditions', () => {
	const globCondition3 = 'one and (two or three) and *.js';

	expect(parseCondition(globCondition3)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [
			{
				type: 'or',
				conditions: [/^two$/, /^three$/],
			},
			/^one$/,
			/^.*\.js$/,
		],
	});

	const globCondition4 = 'one and (per* or *.js)';

	expect(parseCondition(globCondition4)).toEqual<ConditionReturn>({
		type: 'and',
		conditions: [
			{
				type: 'or',
				conditions: [/^per.*$/, /^.*\.js$/],
			},
			/^one$/,
		],
	});
});

it('Should match simple conditions', () => {
	const condition = parseCondition('one and two and three');

	expect(matchConditions(condition, new Set(['one', 'two', 'three']))).toBe(true);

	const condition2 = parseCondition('one or two or three');

	expect(matchConditions(condition2, new Set(['one']))).toBe(true);

	const nestedCondition = parseCondition('one and (two or three)');

	expect(matchConditions(nestedCondition, new Set(['one', 'two']))).toBe(true);
});

it('Should match complex conditions', () => {
	const nestedCondition2 = parseCondition('one and (two or three) and four');

	expect(matchConditions(nestedCondition2, new Set(['one', 'two', 'four']))).toBe(true);

	const doubleNestedCondition = parseCondition('(one and two) or (three and four)');

	expect(matchConditions(doubleNestedCondition, new Set(['one', 'two']))).toBe(true);
	expect(matchConditions(doubleNestedCondition, new Set(['three', 'four']))).toBe(true);
});

it('Should match glob conditions', () => {
	const globCondition = parseCondition('one and two and *.js');

	expect(matchConditions(globCondition, new Set(['one', 'two', 'file.js']))).toBe(true);

	const globCondition2 = parseCondition('one and per*');

	expect(matchConditions(globCondition2, new Set(['one', 'person.js']))).toBe(true);
});

it('Should match the example iok file', () => {
	const rule = parseIOKRule(exampleData);

	const html = [exampleMatch];

	expect(
		matchCheckRule(
			{
				html,
			},
			rule,
		),
	).toBe(true);

	const html2 = [exampleMatch.replace('scrape-url', 'scrape-url2')];

	expect(
		matchCheckRule(
			{
				html: html2,
			},
			rule,
		),
	).toBe(false);
});
