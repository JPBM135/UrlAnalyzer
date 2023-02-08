'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context';

const onSubmit = (elm: React.FormEvent, router: AppRouterInstance) => {
	elm.preventDefault();
	const url = document.querySelector('#url-input') as HTMLInputElement;

	if (!url.value) {
		url.style.border = '2px solid red';
		url.placeholder = 'Please enter a valid URL!';
		return;
	}

	url.style.border = '2px solid green';

	router.push(`/scan/${encodeURIComponent(url.value)}`);
};

export function AnalyzerBar({ router }: { router: AppRouterInstance }) {
	return (
		<div className="flex flex-col justify-center items-center">
			<form className="flex flex-col justify-center items-center" onSubmit={(elm) => onSubmit(elm, router)}>
				<input
					className="w-[27rem] p-2 rounded-lg border-2 text-black"
					id="url-input"
					placeholder="Enter URL"
					type="text"
				/>
				<button type="submit" />
			</form>
		</div>
	);
}
