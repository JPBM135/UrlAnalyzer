import type { UrlAnalysisResult } from '@app/types/types';
import type { FormatBodyReturn } from '@app/utils/formatBody';
import { formatBody } from '@app/utils/formatBody';
import { capitalizeFirstLetter } from '@app/utils/string';
import { useEffect, useRef, useState } from 'react';
import { CodeRenderer } from '../CodeRenderer';

export function PageInfo({ result }: { result: UrlAnalysisResult }) {
	const { consoleOutput, body } = result;

	const worker = useRef<Worker>(new Worker(new URL('../../worker.ts', import.meta.url), { type: 'module' }));

	const [formatted, setFormatted] = useState<FormatBodyReturn | null>(null);
	const [isFormatted, setIsFormatted] = useState(false);

	useEffect(() => {
		const format = async () => {
			const result = await formatBody(body, 'document', worker.current);
			setFormatted(result);
			setIsFormatted(true);
		};

		void format();
	}, [body]);

	return (
		<div className="mb-10 mx-10 p-5 flex flex-col gap-8 justify-between rounded-md bg-white text-white">
			<div className=" flex flex-col gap-2">
				<div className="text-3xl font-bold bg-gray-600 p-4 rounded">Console Output</div>
				{consoleOutput.length ? (
					consoleOutput.map((item, idx) => (
						<div className="flex flex-col bg-gray-400 rounded p-4 text-xl gap-2" key={idx}>
							<div className="flex">
								<div className="font-bold">{capitalizeFirstLetter(item.type)}</div> <div>-</div> <div>{item.text}</div>
							</div>
							{item.args.length && <div className="flex flex-col gap-2">{item.args.join(', ')}</div>}
						</div>
					))
				) : (
					<div className="gap-2 bg-gray-400 rounded p-4 text-xl">No console output</div>
				)}
			</div>
			<div className="border border-gray-600" />
			<div className=" flex flex-col gap-2">
				<div className="text-3xl font-bold bg-gray-600 p-4 rounded">Body</div>
				{isFormatted ? (
					<pre className="bg-gray-900 rounded p-7 whitespace-pre-wrap break-all">
						<CodeRenderer data={formatted!.data} ok={formatted!.ok} />
					</pre>
				) : (
					<div className="gap-2 bg-gray-600 rounded p-4 text-3xl">Loading...</div>
				)}
			</div>
		</div>
	);
}
