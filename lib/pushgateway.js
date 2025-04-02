'use strict';

const { globalRegistry } = require('./registry');

class Pushgateway {
	constructor(gatewayUrl, options, registry) {
		if (!registry) {
			registry = globalRegistry;
		}
		this.registry = registry;
		this.gatewayUrl = gatewayUrl;
		const { requireJobName, ...requestOptions } = {
			requireJobName: true,
			...options,
		};
		this.requireJobName = requireJobName;
		this.requestOptions = requestOptions;
	}

	pushAdd(params = {}) {
		if (this.requireJobName && !params.jobName) {
			throw new Error('Missing jobName parameter');
		}

		return useGateway.call(this, 'POST', params.jobName, params.groupings);
	}

	push(params = {}) {
		if (this.requireJobName && !params.jobName) {
			throw new Error('Missing jobName parameter');
		}

		return useGateway.call(this, 'PUT', params.jobName, params.groupings);
	}

	delete(params = {}) {
		if (this.requireJobName && !params.jobName) {
			throw new Error('Missing jobName parameter');
		}

		return useGateway.call(this, 'DELETE', params.jobName, params.groupings);
	}
}

async function useGateway(method, job, groupings) {
	const gatewayUrl = new URL(this.gatewayUrl);
	const gatewayUrlPath =
		gatewayUrl.pathname && gatewayUrl.pathname !== '/' ? gatewayUrl.pathname : '';
	const jobPath = job
		? `/job/${encodeURIComponent(job)}${generateGroupings(groupings)}`
		: '';
	const path = `${gatewayUrlPath}/metrics${jobPath}`;
	const target = new URL(path, this.gatewayUrl);

	const options = {
		method,
		headers: {
			...this.requestOptions.headers,
		},
	};

	if (method !== 'DELETE') {
		try {
			const metrics = await this.registry.metrics();
			options.body = metrics;
		} catch (err) {
			throw err;
		}
	}

	const response = await fetch(target.toString(), options);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`push failed with status ${response.status}, ${body}`);
	}

	const responseBody = await response.text();
	return { resp: response, body: responseBody };
}

function generateGroupings(groupings) {
	if (!groupings) {
		return '';
	}
	return Object.keys(groupings)
		.map(
			key =>
				`/${encodeURIComponent(key)}/${encodeURIComponent(groupings[key])}`,
		)
		.join('');
}

module.exports = Pushgateway;
