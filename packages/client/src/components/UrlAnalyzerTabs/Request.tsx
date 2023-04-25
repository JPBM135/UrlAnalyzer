'use client';

import type { POSTFormatBodyEndpointReturn } from '@app/types';
import type { UrlAnalysisResult } from '@app/types/types';
import { makeApiRequest } from '@app/utils/makeApiReq';
// @ts-expect-error: No types for highlight.js styles
import style from 'highlight.js/styles/atom-one-dark.css';
import { useState } from 'react';
import { CodeRenderer } from '../CodeRenderer';
import { FormatHeaders } from './RequestHeaders';

interface RawFormattedData {
	data: string;
	ok: boolean;
}

interface FormattedBodies {
	[key: string]: RawFormattedData | boolean;
}

const formatBody = async ({
	resource_type,
	formattedBodies,
	setFormattedBodies,
	id,
}: {
	formattedBodies: FormattedBodies;
	id: string;
	resource_type: string;
	setFormattedBodies(formattedBodies: FormattedBodies): void;
}) => {
	setFormattedBodies({
		...formattedBodies,
		[id]: true,
	});

	const formatted = await makeApiRequest<POSTFormatBodyEndpointReturn>('/formatter/format', {
		method: 'POST',
		body: JSON.stringify({ id, resource_type }),
	});

	setFormattedBodies({
		...formattedBodies,
		[id]: formatted.data!,
	});
};

export function Requests({ result }: { result: UrlAnalysisResult }) {
	const { requests } = result;

	const [opened, setOpened] = useState<string[]>([]);
	const [formattedBodies, setFormattedBodies] = useState<FormattedBodies>({});

	return (
		<div className="mb-10 mx-10 p-5 flex justify-between rounded-md bg-white">
			<div style={{ width: '80%', margin: '0 auto' }}>
				<div className="text-5xl font-bold font-sans p-5 pb-10">Requests:</div>
				{requests.map((request, idx) => {
					const urlClass = new URL(request.url);
					let urlWithoutQuery: string | null = `${urlClass.origin}/${urlClass.pathname.split('/')[1]!}`;

					if (urlWithoutQuery === 'null') urlWithoutQuery = null;

					const urlHref = new URL(request.url).href.split(';')[0];

					const isExpanded = opened.includes(request.id);

					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					const readableIndex = `${idx + 1}°`;

					if (!isExpanded) {
						return (
							<div
								className="flex bg-gray-500 rounded p-5 m-10 justify-between cursor-pointer"
								key={request.nonce}
								onClick={() => setOpened([...opened, request.id])}
							>
								<div className="text-white p-2">
									<span className="font-bold text-2xl">
										{readableIndex} | {urlWithoutQuery ?? urlHref}
									</span>
								</div>
								<div className="flex justify-between">
									<div className="text-white p-2">
										<span className="font-bold">Method: </span>
										{request.method}
									</div>
									<div className="text-white p-2">
										<span className="font-bold">Status: </span>
										{request.response?.status || 'N/A'}
									</div>
								</div>
							</div>
						);
					}

					return (
						<div className="bg-gray-500 rounded p-5 m-10" key={request.nonce}>
							<div className="bg-gray-600 flex justify-between p-2 rounded mb-3">
								<div className=" text-white p-2 text-xl ">
									{readableIndex} | {urlWithoutQuery ?? urlHref}
								</div>
								<button
									className="bg-red-500 rounded text-white p-2"
									onClick={() => setOpened(opened.filter((id) => id !== request.id))}
									type="button"
								>
									<span className="font-bold">Close</span>
								</button>
							</div>
							<div className="flex flex-col">
								<div className="flex">
									<div>
										<div className="text-white p-1 ml-2">
											<span className="font-bold">Id: </span>
											{request.id}
										</div>
										<div className="text-white p-1 ml-2">
											<span className="font-bold">Method: </span>
											{request.method}
										</div>
									</div>
									<div>
										<div className="text-white p-1 ml-2">
											<span className="font-bold">Status: </span>
											{request.response?.status || 'N/A'}
										</div>
										<div className="text-white p-1 ml-2">
											<span className="font-bold">Resource type: </span>
											{request.resource_type || 'N/A'}
										</div>
									</div>
								</div>
								<div>
									<div className="text-white p-1 ml-2">
										<span className="font-bold">Full Url: </span>
										<span className="text-gray-800">{request.url}</span>
									</div>
								</div>
							</div>
							<div className="text-white p-1 my-2 ml-2 border-t-2 border-t-gray-400">
								<FormatHeaders headers={request.headers} title="Request Headers" />
							</div>
							{request.post_data && (
								<div className="text-white p-1 my-2 ml-2 border-t-2 border-t-gray-400">
									<div className="font-bold py-3 text-xl">Request body: </div>
									<div className="bg-gray-600 p-2 rounded">{request.post_data || 'N/A'}</div>
								</div>
							)}
							{request.response && (
								<div className="text-white p-1 my-2 ml-2 border-t-2 border-t-gray-400">
									<div className="font-bold py-3 text-2xl">Response: </div>
									<div className="text-white p-1">
										<FormatHeaders headers={request.response.headers} title="Response Headers" />
									</div>
									{request.response.body && (
										<div className="text-white p-1 my-2 ml-2 border-t-2 border-t-gray-400">
											<div className="font-bold py-3 text-xl">Response body: </div>
											<pre className="whitespace-pre-wrap">
												{request.response.body && formattedBodies[request.id] ? (
													typeof formattedBodies[request.id] === 'boolean' ? (
														<div className="bg-gray-600 break-all p-3 rounded word-wrap">Loading...</div>
													) : (
														<CodeRenderer
															data={(formattedBodies[request.id]! as RawFormattedData).data}
															ok={(formattedBodies[request.id]! as RawFormattedData).ok}
														/>
													)
												) : (
													<button
														className="bg-gray-600 p-3 rounded"
														onClick={async () =>
															formatBody({
																id: request.id,
																formattedBodies,
																resource_type: request.resource_type,
																setFormattedBodies,
															})
														}
														type="button"
													>
														Show Body
													</button>
												)}
											</pre>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
