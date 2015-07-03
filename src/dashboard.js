var _ = require('lodash');
var d3 = require('d3');
var queue = require('queue-async');

var Layout = require('./layout.js');

var Hose = require('hose-client').Hose;
var hoseCharts = require('hose-charts');
var formatters = require('./formatters.js');

function Dashboard(selector, modelUrl, layoutUrl) {
	if (modelUrl && layoutUrl) {
		return queue()
			.defer(d3.json, modelUrl)
			.defer(d3.json, layoutUrl)
			.await(function(error, model, layout) {
				if (error) {
					throw error;
				}
				createDashboard(selector, model, layout);
			});
	} else {
		return queue()
			.defer(d3.json, 'examples/hello-dashboard/model.json')
			.await(function(error, model) {
				if (error) {
					throw error;
				}
				createDashboard(selector, model, {
					type: 'rows',
					contents: [{
						type: 'selection',
					}, {
						type: 'columns',
						contents: []
					}],
				});
			});
	}
}

function createDashboard(selector, model, layout) {
	var hose = new Hose(model.hose.address);
	hose.onAuthGranted = function() {
		hose.select({ selection: '*', from: model.table });
	};

	Layout({
		selector: selector,
		initialLayout: layout,
		model: model,
		hose: hose,
	});
}

exports.Dashboard = Dashboard;
exports.createDashboard = createDashboard;
exports.Layout = Layout;
