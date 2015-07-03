var _ = require('lodash');
var Formatters = require('./formatters.js');
var HoseCharts = require('hose-charts');
var ChartEditor = require('./chart-editor.js').ChartEditor;
var d3 = require('d3');
var simpleModal = require('simple-modal');

function render(opts, data, parent) {
	var me = document.createDocumentFragment();

	if (data.type === 'rows' || data.type === 'columns') {
		me.appendChild(renderContainer(opts, data, parent));
		me.firstElementChild.classList.add(data.type);
	}

	else if (data.type === 'chart') {
		me.appendChild(renderChart(opts, data, parent));
		me.firstElementChild.classList.add('chart');
	}

	else if (data.type === 'selection') {
		me.appendChild(renderSelection(opts, data, parent));
		me.firstElementChild.classList.add('selection');
	}

	if (!me.firstElementChild) {
		console.error('Unknown render type:', data.type);
		return me;
	}

	me.firstElementChild.__data__ = data;
	if (data.type !== 'selection') {
		data.size = data.size || 1;
		me.firstElementChild.style.flexGrow = data.size;
	} else {
		me.firstElementChild.style.flexBasis = '60px';
	}

	if (!data.contents || !data.contents.length) {
		me.firstElementChild.classList.add('leaf');
		me.firstElementChild.appendChild(renderButtons(opts, data, parent));
	}

	return me;
}

function renderContainer(opts, data, parent) {
	var me = document.createElement('div');
	data.contents.forEach(function(content) {
		me.appendChild(render(opts, content, data));
	});
	return me;
}

function renderChart(opts, data, parent) {
	var me = document.createElement('div');

	if (data.label && data.label.length) {
		var label = document.createElement('label');
		label.innerHTML = data.label;
		me.appendChild(label);
	}

	var chartContainer = document.createElement('div');
	chartContainer.classList.add('chart-main');
	me.appendChild(chartContainer);

	var fields = lookupFields(opts.fields, data.fields);
	var chartConstructor = HoseCharts.charts[data.chartType];
	if (chartConstructor) {
		var chart = chartConstructor({
			element: d3.select(chartContainer),
			hose: opts.hose,
			fields: fields,
		});
		opts.charts.push(chart);
		me.__chart__ = chart;
	} else {
		console.error('Unknown chart type:', data.chartType);
	}

	return me;
}

function renderSelection(opts, data, parent) {
	var me = document.createElement('div');

	var label = document.createElement('span');
	label.classList.add('label');
	me.appendChild(label);

	var list = document.createElement('ul');
	me.appendChild(list);

	var primaryField = opts.fields[opts.model.primaryField];

	opts.hose.onSelect(function(selection) {
		var filters = _.pairs(selection.filters);

		label.innerHTML = filters.length
			? (primaryField.label + ' where:')
			: ('All ' + primaryField.label);

		list.innerHTML = '';

		filters.forEach(function(filter) {
			var key = filter[0];
			var value = filter[1];
			var field = opts.fields[key];
			if (!field) {
				throw "Cannot find field " + key;
			}

			var li = document.createElement('li');			list.appendChild(li);
			var keyEl = document.createElement('em');		li.appendChild(keyEl);
			var is = document.createElement('span');		li.appendChild(is);
			var valueEl = document.createElement('em'); li.appendChild(valueEl);
			var close = document.createElement('a');		li.appendChild(close);

			keyEl.innerHTML = field.label;
			valueEl.innerHTML = (field.format || _.identity)(value);
			is.innerHTML = ' is ';
			close.classList.add('remove');
			close.innerHTML = '&#x2715;';
			close.onclick = function() {
				opts.hose.unfilter(key);
			}
		});
	});

	return me;
}

function renderButtons(opts, data, parent) {
	var buttons = document.createElement('div');
	buttons.classList.add('buttons');

	var splitH = document.createElement('button');
	splitH.appendChild(renderFontAwesome('columns', 'rotate-270'));
	buttons.appendChild(splitH);
	splitH.onclick = splitHandler(opts, 'rows', 'columns');
	splitH.title = 'Add a row';

	if (data.type !== 'selection') {
		var splitV = document.createElement('button');
		splitV.appendChild(renderFontAwesome('columns'));
		buttons.appendChild(splitV);
		splitV.onclick = splitHandler(opts, 'columns', 'rows');
		splitV.title = 'Add a column';
	}

	if (data.type !== 'chart' && data.type !== 'selection') {
		var makeChart = document.createElement('button');
		makeChart.appendChild(renderFontAwesome('bar-chart'));
		buttons.appendChild(makeChart);
		makeChart.onclick = addChartHandler(opts);
		makeChart.title = 'Make a chart';
	}

	if (data.type === 'chart') {
		var editChart = document.createElement('button');
		editChart.appendChild(renderFontAwesome('bar-chart'));
		buttons.appendChild(editChart);
		editChart.onclick = editChartHandler(opts);
		editChart.title = 'Edit this chart';
	}

	if (data.type !== 'selection') {
		var remove = document.createElement('button');
		remove.appendChild(renderFontAwesome('close'));
		buttons.appendChild(remove);
		remove.onclick = removeHandler(opts);
		remove.title = 'Remove this';
	}

	buttons.onmouseover = function() { opts.root.classList.add('showLayout'); };
	buttons.onmouseout = function() { opts.root.classList.remove('showLayout'); };

	return buttons;
}

function splitHandler(opts, outer, inner) {
	return function () {
		var element = this.parentNode.parentNode;
		var data = element.__data__;
		var parentElement = element.parentNode;
		var parent = parentElement.__data__;

		if (parent.type === outer) {
			// Easy case - we can simply add a new child element.
			var child = {
				type: inner,
				contents: [],
			};
			parent.contents.push(child);
			var childEl = render(opts, child, parent);
			parentElement.insertBefore(childEl, element.nextSibling);
		} else {
			// Hard case - we have to do some juggling. What's going on here is that
			// when we create a split, we have to replace this content with a container
			// and then put this content into that container.
			var container = {
				type: outer,
				size: data.size,
				contents: [{
					type: inner,
					contents: [],
					size: 1,
				}],
			};
			var containerFrag = render(opts, container, parent);
			var containerEl = containerFrag.firstElementChild;
			container.contents.unshift(data);
			parentElement.insertBefore(containerFrag, element);
			containerEl.insertBefore(element, containerEl.children[0]);
			data.size = 1;
			element.style.flexGrow = 1;
		}

		window.onresize();
	}
}

function addChartHandler(opts) {
	return function() {
		var element = this.parentNode.parentNode;
		var data = element.__data__;
		var parentElement = element.parentNode;
		var parent = parentElement.__data__;

		var modal = simpleModal({
			title: 'Add chart',
			content: '',
			buttons: [{
				text: 'Cancel',
			}, {
				text: 'Add',
				callback: addChart,
			}],
		});

		var editor = ChartEditor({
			element: d3.select(modal.m).select('.simple-modal-content'),
			model: opts.model,
			hose: opts.hose,
			chartType: 'pie',
		});

		function addChart() {
			delete data.contents;
			data.fields = unlookupFields(editor.fields);
			data.type = 'chart';
			data.chartType = editor.chartType;
			element.innerHTML = '';
			parentElement.replaceChild(render(opts, data, parent), element);
			opts.hose.select({ selection: '*', from: opts.model.table });
			window.onresize();
		}
	}
}

function editChartHandler(opts) {
	return function() {
		var element = this.parentNode.parentNode;
		var data = element.__data__;
		var parentElement = element.parentNode;
		var parent = parentElement.__data__;

		var modal = simpleModal({
			title: 'Edit chart',
			content: '',
			buttons: [{
				text: 'Cancel',
			}, {
				text: 'Save',
				callback: saveChart,
			}],
		});

		var fields = lookupFields(opts.fields, data.fields);
		var editor = ChartEditor({
			element: d3.select(modal.m).select('.simple-modal-content'),
			model: opts.model,
			hose: opts.hose,
			chartType: data.chartType,
			fields: fields,
			label: data.label,
		});

		function saveChart() {
			if (_.isEqual(editor.fields, fields) && _.isEqual(editor.label, data.label)) {
				return;
			}
			data.fields = unlookupFields(editor.fields);
			data.label = editor.label;
			data.chartType = editor.chartType;
			var chart = element.__chart__;
			if (chart) {
				chart.remove();
				_.pull(opts.charts, chart);
			}
			parentElement.replaceChild(render(opts, data, parent), element);
			opts.hose.select({ selection: '*', from: opts.model.table });
			window.onresize();
		}
	}
}

function removeHandler(opts) {
	return function() {
		var element = this.parentNode.parentNode;
		var data = element.__data__;
		var parentElement = element.parentNode;
		var parent = parentElement.__data__;
		var grandparent = parentElement.parentNode.__data__;

		if (parent.contents.length === 1) {
			if (data.type === 'chart') {
				// Remove chart and restore original blank layout.
				data.type = 'rows';
				data.contents = [];
				parentElement.replaceChild(render(opts, data, parent, parentElement), element);
			}
			return;
		}

		// Remove this item from places we have references to it, including the DOM.
		parent.contents.splice(parent.contents.indexOf(data), 1);
		var chart = element.__chart__;
		if (chart) {
			chart.remove();
			_.pull(opts.charts, chart);
		}
		element.remove();

		// Collapse upwards - if there's now only one content remaining in the parent's
		// contents, replace the parent container with that piece of content.
		if (parent.contents.length === 1 && grandparent) {
			// Collapse elements.
			var other = parentElement.children[0];
			other.style.flexGrow = parentElement.style.flexGrow;
			parentElement.parentNode.replaceChild(other, parentElement);

			// Collapse data.
			data = other.__data__;
			data.size = parent.size;
			parent.type = data.type;
			if (data.chartType) {
				parent.chartType = data.chartType;
			} else {
				delete parent.chartType;
			}
			if (data.contents) {
				parent.contents = data.contents;
			} else {
				delete parent.contents;
			}
		}

		window.onresize();
	}
}

function renderFontAwesome() {
	var i = document.createElement('i');
	i.classList.add('fa');
	for (j = 0; j < arguments.length; j++) {
		i.classList.add('fa-'+arguments[j]);
	}
	return i;
}

function unlookupFields(fields) {
	fields = _.cloneDeep(fields);

	_.forEach(fields, function(value, key) {
		if (value.field) {
			value.field = value.field.name;
		} else if (value.name) {
			fields[key] = value.name;
		} else {
			console.error('Misunderstood field format:', key, JSON.stingify(value));
		}
	});

	return fields;
}

// The layout data specifies field names, which must be resolved to the field
// objects which contain their metadata (type, etc.). We also use the opportunity
// to add redferences to formatting functions based on the field type.
function lookupFields(fieldDict, fields) {
	fields = _.cloneDeep(fields);

	_.forEach(fields, function(value, key) {
		if (typeof value === typeof '') {
			fields[key] = lookupField(value);
		} else if (value.field) {
			value.field = lookupField(value.field);
		}
	});

	function lookupField(fieldName) {
		var field = fieldDict[fieldName];
		if (!field) {
			console.error("Field name not found! " + fieldName);
			return fieldName;
		}
		field.format = Formatters.get(field.type);
		return field;
	}

	return fields;
}

function layout(opts) {
	opts.fields = _.indexBy(opts.model.fields, 'name');

	opts.charts = [];
	var element = document.querySelector(opts.selector);
	element.classList.add('root');
	opts.root = element;
	element.appendChild(render(opts, opts.initialLayout, null));

	resizeCharts();
	window.onresize = _.debounce(resizeCharts, 100);
	function resizeCharts() {
		opts.charts.forEach(function(chart) { chart.resize(); });
	}
}

module.exports = layout;
