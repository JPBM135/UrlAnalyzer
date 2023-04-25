import hljs from 'highlight.js/lib/common';
import { format } from 'prettier';
import parserJson from 'prettier/parser-babel.js';
import parserHtml from 'prettier/parser-html.js';
import parserCss from 'prettier/parser-postcss.js';
import parserTypescript from 'prettier/parser-typescript.js';

export interface FormatBodyReturn {
	data: string;
	ok: boolean;
}

export function jsonFormat(data: string): string {
	const formatted = format(data, {
		parser: 'json',
		plugins: [parserJson],
	});

	return hljs.highlight(formatted, {
		language: 'json',
	}).value;
}

export function httpFormat(data: string) {
	const formatted = format(data, {
		parser: 'html',
		plugins: [parserHtml],
	});

	return hljs.highlight(formatted, {
		language: 'html',
	}).value;
}

export function jsFormat(data: string): string {
	const formatted = format(data, {
		parser: 'typescript',
		plugins: [parserTypescript],
	});

	return hljs.highlight(formatted, {
		language: 'javascript',
	}).value;
}

export function formatCss(data: string): string {
	const formatted = format(data, {
		parser: 'css',
		plugins: [parserCss],
		useTabs: true,
	});

	return hljs.highlight(formatted, {
		language: 'css',
	}).value;
}

export function findFormatter(data: string, resource_type: string): { data: string; ok: boolean } {
	try {
		switch (resource_type) {
			case 'script':
				return {
					data: jsFormat(data),
					ok: true,
				};
			case 'stylesheet':
				return {
					data: formatCss(data),
					ok: true,
				};
			case 'xhr':
			case 'fetch':
				return {
					data: jsonFormat(data),
					ok: true,
				};
			case 'document':
				return {
					data: httpFormat(data),
					ok: true,
				};
			default:
				return {
					data,
					ok: false,
				};
		}
	} catch {
		return {
			data,
			ok: false,
		};
	}
}
