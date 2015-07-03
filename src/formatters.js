var d3 = require('d3');

var formatDate = d3.time.format("%d %b %Y");

var formatNumber = d3.format(".03s");
var formatLargeNumber = d3.format(",f");

var formatCurrency = function(c) {
	var format = d3.formatPrefix(c);
	var number = formatNumber(format.scale(c));
	switch (format.symbol) {
		case 'm':
			return '$'+number/1000;
		case 'G':
			return '$'+number+'B';
		default:
			return '$'+number+format.symbol;
	}

	return '$' + formatNumber(c)
};

var formatWeight = function(w) {
	var format = d3.formatPrefix(w);
	var number = formatNumber(format.scale(w));
	var convertSymbol = {
		'': 'kg',
		'm': 'g',
		'k': 't',
		'M': 'kt',
		'G': 'Mt',
		'T': 'Gt',
	};
	return number + (convertSymbol[format.symbol] || (format.symbol + ' kg'));
};

module.exports = d3.map({
	'date': formatDate,
	'number': formatNumber,
	'currency': formatCurrency,
	'mass': formatWeight,
});
