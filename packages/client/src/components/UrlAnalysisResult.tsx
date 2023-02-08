'use client';

import type { POSTScanResultEndpointReturn } from '@app/types';
import { TransparencyReportGenericStatus, TransparencyReportFlags } from '@app/types/enums';
import { generateRandomHash } from '@app/utils/generateRandom';
import Image from 'next/image';
import { FcHighPriority, FcOk } from 'react-icons/fc';
import favicon from '../public/favicon.ico';

export function UrlAnalysisResult({ res }: { res: POSTScanResultEndpointReturn }) {
	const { data } = res;

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	if (!data)
		return (
			<div className="text-white">
				<h1 className="text-2xl">No data found!</h1>
			</div>
		);

	const { url, effectiveUrl, certificate, screenshot, securityDetails } = data;

	const safeBrowsingIssue = Boolean(securityDetails.safeBrowsing.length);
	const transparencyReportIssue = [2, 3, 5].includes(securityDetails.transparencyReport!.status!);

	return (
		<>
			<div className="flex gap-1 p-5 mx-10 justify-evenly bg-slate-500 rounded">
				<button className="h-full py-2 w-full" type="button">
					General Information
				</button>
				<div className="border border-gray-200" />
				<button className="h-full py-2 w-full" type="button">
					Requests
				</button>
				<div className="border border-gray-200" />
				<button className="h-full py-2 w-full" type="button">
					Console
				</button>
				<div className="border border-gray-200" />
				<button className="h-full py-2 w-full" type="button">
					Body
				</button>
			</div>
			<div className="mb-10 mx-10 p-5 flex justify-between rounded-md bg-white">
				<div className="text-black text-xl">
					<div className="bg-gray-300 rounded-md p-4">
						<div>
							<span className="text-2xl font-bold text-gray-600">Url: </span> {url}
						</div>
						<div>
							<span className="text-2xl font-bold text-gray-600">Effective Url: </span> {effectiveUrl}
						</div>
					</div>
					<div className="bg-gray-300 rounded-md p-4 mt-4">
						<div className="flex flex-col">
							<div className="inline-flex gap-2">
								<span className="text-2xl font-bold text-gray-600">Safe Browsing:</span>
								{safeBrowsingIssue ? (
									<FcHighPriority className="my-auto" size={28} />
								) : (
									<FcOk className="my-auto" size={28} />
								)}
							</div>
							<details>
								<summary>Details</summary>
								{safeBrowsingIssue
									? securityDetails.safeBrowsing.slice(0, 1).map((sb) => (
											<ul className="list-disc list-inside" key={generateRandomHash()}>
												<li>
													<span className="font-bold">Platform Type:</span> {sb.platformType}
												</li>
												<li>
													<span className="font-bold">Threat Type:</span> {sb.threatType}
												</li>
												<li>
													<span className="font-bold">Threat Entry Type:</span> {sb.threatEntryType}
												</li>
												<li>
													<span className="font-bold">Url:</span> {sb.url}
												</li>
											</ul>
									  ))
									: 'No issues found'}
							</details>
							<div className="inline-flex gap-2">
								<span className="text-2xl font-bold text-gray-600">Transparency Report:</span>
								{transparencyReportIssue ? (
									<FcHighPriority className="my-auto" size={28} />
								) : (
									<FcOk className="my-auto" size={28} />
								)}
							</div>
							<details>
								<summary>Details</summary>
								{securityDetails.transparencyReport ? (
									<ul className="list-disc list-inside" key={generateRandomHash()}>
										<li>
											<span className="font-bold">Status:</span>{' '}
											{TransparencyReportGenericStatus[securityDetails.transparencyReport.status]}
										</li>
										<li>
											<span className="font-bold">Flags:</span>
											{securityDetails.transparencyReport.flags.length ? (
												<ul>
													{securityDetails.transparencyReport.flags.map((flag) => (
														<li key={generateRandomHash()}>{TransparencyReportFlags[flag]}</li>
													))}
												</ul>
											) : (
												' No flags provided'
											)}
										</li>
										<li>
											<span className="font-bold">Last Checked:</span>{' '}
											{dateFormat.format(securityDetails.transparencyReport.lastTimeChecked)}
										</li>
										<li>
											<span className="font-bold">Url:</span> {securityDetails.transparencyReport.url}
										</li>
									</ul>
								) : (
									'No issues found'
								)}
							</details>
						</div>
					</div>
				</div>
				<div className="text-black text-xl">
					<div>
						<div className="text-gray-600 text-center font-sans font-bold"> Screenshot: </div>
						<Image
							alt="Screenshot"
							className="border-2 rounded border-black"
							height={90 * 3}
							src={screenshot?.url ?? favicon}
							width={160 * 3}
						/>
					</div>
					<div className="mt-4">
						<div className="text-gray-600 text-center font-sans font-bold"> SSL Certificate: </div>
						<div className="bg-gray-300 rounded-md p-4">
							<div className="flex flex-col">
								<span className="text-2xl font-bold text-gray-600">Subject Name: </span> {certificate.subjectName}
								<span className="text-2xl font-bold text-gray-600">Issuer Name: </span> {certificate.issuer}
								<span className="text-2xl font-bold text-gray-600">Valid From: </span>
								{dateFormat.format(certificate.validFrom * 1_000)}
								<span className="text-2xl font-bold text-gray-600">Valid To: </span>{' '}
								{dateFormat.format(certificate.validTo * 1_000)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
