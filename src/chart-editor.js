var d3 = require('d3');
var hoseCharts = require('hose-charts');
var _ = require('lodash');

function ChartEditor(opts) {
    var self = this;
    var element = opts.element;
    var model = opts.model;
    var hose = opts.hose;
    var chartType = opts.chartType;
    var fields = _.cloneDeep(opts.fields) || {};
    self.fields = fields;
    self.label = opts.label;

    // Lookup for fields
    var fieldDict = d3.map(model.fields, function(f) { return f.name; });

    // Create elements
    var container = element.append('div')
        .classed('chart-editor', true)
    var header = container.append('div')
        .classed('header', true)
    var chartFieldsElement = container.append('div')
        .classed('chart-model', true)
    var chartElement = container.append('div')
        .classed('chart-container', true)

    // Create chart type selection
    var chartLabel = header.append('input')
        .attr('value', self.label)
        .on('input', function(d) {
            self.label = this.value;
        })
    var chartTypeSelect = header.append('select')
        .on('change', function(d) {
            // Update chart type
            self.chartType = this.value;
            self.chart = createChart(this.value);

            // Render the initial chart
            updateChart(chartElement, self.chart, fields);
        })
    var chartTypeOptions = chartTypeSelect.selectAll('option')
        .data(d3.entries(hoseCharts.charts))
        .enter().append('option')
            .text(function(d) { return d.key; })
    chartTypeSelect.node().value = chartType;

    // Create the chart and chart fields
    self.chartType = chartType;
    self.chart = createChart(chartType);

    // Render the initial chart
    updateChart(chartElement, self.chart, fields);

    function createChart(chartType) {
        // Get chart
        var chart = hoseCharts.charts[chartType];

        // Clear chart fields
        chartFieldsElement.selectAll('*').remove();

        // Create contents
        var chartFields = chartFieldList(chartFieldsElement, chart.fields);

        return chart;
    }

    function updateChart(element, chart, fields) {
        // Clear chart
        element.select('.chart').remove();

        // Create chart
        var chartElement = element.append('div')
            .classed('chart', true)

        chart({
            element: chartElement,
            hose: hose,
            fields: fields,
        })

        hose.select({ selection: '*', from: model.table, limit: 200 });
    }

    function fieldList(element, fields, selection) {
        var fieldsList = element.append('select')
            .classed('fields', true)

        var fieldsItems = fieldsList.selectAll('.field')
            .data(fields)

        var fieldItem = fieldsItems.enter()
            .append('option')
            .classed('field', true)
            .attr('value', _.property('name'))

        if (selection)
            fieldItem.attr('selected', function(d) {
                return d.name === selection.name ? 'selected' : undefined;
            })

        fieldItem.insert('i')
            .attr('class', function(d) {
                switch(d.type) {
                    case 'mass':
                    case 'currency':
                    case 'number':
                        return 'fa fa-sort-numeric-asc';
                    case 'ordinal':
                        return 'fa fa-sort-amount-asc';
                    case 'categorical':
                        return 'fa fa-list-ul';
                    case 'date':
                        return 'fa fa-calendar';
                    default:
                        return 'fa fa-list-ul';
                }
            })

        fieldItem.append('span')
            .text(function(d) { return d.label; })

        return fieldsList;
    }

    function aggregates(fieldType) {
        var aggregates = [];

        switch (fieldType) {
            case 'mass':
            case 'currency':
            case 'number':
                aggregates.push({label: 'Average', value: 'avg'});
                aggregates.push({label: 'Total', value: 'sum'});
            case 'ordinal':
                aggregates.push({label: 'Maximum', value: 'max'});
                aggregates.push({label: 'Minimum', value: 'min'});
            case 'categorical':
            default:
                aggregates.push({label: 'Count', value: 'count'});
        }

        return aggregates;
    }

    function aggregateList(element, fieldType, selection) {
        var aggList = element.append('select')
            .classed('aggregates', true)

        var aggItems = aggList.selectAll('.select')
            .data(aggregates(fieldType))

        var aggItem = aggItems.enter()
            .append('option')
            .classed('aggregate', true)
            .attr('value', _.property('value'))
            .text(_.property('label'))

        if (selection)
            aggItem.attr('selected', function(d) {
                return d.value === selection ? 'selected' : undefined;
            })

        return aggList;
    }

    function chartFieldList(element, chartFields) {
        var fieldsList = element.append('ul')
            .classed('fields', true)

        var fieldsItems = fieldsList.selectAll('.field')
            .data(chartFields)

        fieldsItems.enter()
            .append('li')
            .classed('field', true)
            .text(function(d) { return d.name; })
            .each(function(chartField) {
                var item = d3.select(this);
                var field = fields[chartField.name];
                if (chartField.type === 'aggregate') {
                    if (!field) {
                      field = fields[chartField.name] = {field: {}};
                    }

                    // Create drop down
                    var input = fieldList(item, model.fields, field.field);
                    var aggInput = aggregateList(item, field.field.type, field.aggregate);

                    input
                        .on('change', function() {
                            // Update field
                            var field = fields[chartField.name];
                            field.field = fieldDict.get(this.value);
                            
                            // Update aggregate value
                            var aggs = aggregates(field.field.type);
                            fields[chartField.name].aggregate = aggs[0].value;

                            // Update chart
                            if (self.chart)
                                updateChart(chartElement, self.chart, fields);

                            // Remove old aggregate selection
                            item.select('.aggregates').remove();

                            // Update aggregate input
                            var aggInput = aggregateList(item, field.field.type, field.aggregate);
                        })

                     aggInput
                        .on('change', function() {
                            fields[chartField.name].aggregate = this.value;

                            // Update chart
                            if (self.chart)
                                updateChart(chartElement, self.chart, fields);
                         })
                } else {
                    // Create drop down
                    var input = fieldList(item, model.fields, field);

                    input
                        .on('change', function() {
                            // Update field
                            fields[chartField.name] = fieldDict.get(this.value);

                            // Update chart
                            if (self.chart)
                                updateChart(chartElement, self.chart, fields);
                         })
                }
             })
    }

    return self;
}

module.exports.ChartEditor = ChartEditor;
