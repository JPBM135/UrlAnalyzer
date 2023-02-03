'use client';

const onSubmit = (elm: React.FormEvent) => {
	elm.preventDefault();
	const url = document.querySelector('#url-input') as HTMLInputElement;

	if (!url.value) {
		url.style.border = '2px solid red';
		url.placeholder = 'Please enter a valid URL!';
		return;
	}

	url.style.border = '2px solid green';

	console.log(url.value);
};

export function AnalyzerBar() {
	return (
		<div className="flex flex-col justify-center items-center">
			<form className="flex flex-col justify-center items-center" onSubmit={onSubmit}>
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
