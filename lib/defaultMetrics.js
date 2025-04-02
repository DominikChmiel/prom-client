'use strict';

const { isObject } = require('./util');


const metrics = {
};
const metricsList = Object.keys(metrics);

module.exports = function collectDefaultMetrics(config) {
	if (config !== null && config !== undefined && !isObject(config)) {
		throw new TypeError('config must be null, undefined, or an object');
	}

	config = { eventLoopMonitoringPrecision: 10, ...config };

	for (const metric of Object.values(metrics)) {
		metric(config.register, config);
	}
};

module.exports.metricsList = metricsList;
