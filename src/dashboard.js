var _ = require('lodash');
var d3 = require('d3');
var queue = require('queue-async');

var Layout = require('./layout.js');

var Hose = require('hose-client').Hose;
var hoseCharts = require('hose-charts');
var formatters = require('./formatters.js');

function Dashboard(selector, ckan, dataset) {
	var apiUrl = ckan + '/api/action/datastore_search';
	var model = {
		hose: {
			address: "ws://localhost:8000"
		},
		table: '"'+dataset+'"',
	};
	var layout = {
		type: 'rows',
		contents: [{
			type: 'selection',
		}, {
			type: 'columns',
			contents: []
		}],
	};
	
	if (dataset) {
		return queue()
			.defer(d3.json, apiUrl+'?limit=0&resource_id='+dataset)
			.await(function(error, response) {
				if (error) {
					throw error;
				}
				model.fields = response.result.fields.map(function(field) {
					return {
						name: '"'+field.id+'"',
						label: _.capitalize(field.id),
						type: field.type == 'numeric' ? 'number' : 'categorical',
					};
				});
				model.primaryField = model.fields[0].name;
console.log(model, layout);
				createDashboard(selector, model, layout);
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
