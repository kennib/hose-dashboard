var Dashboard = require('./src/dashboard.js').Dashboard;
var Layout = require('./src/dashboard.js').Layout;

var url = window.location.hash.substr(1);

// Either we are given a dashboard to view
if (url && url.length) {
    Dashboard('body', 'http://data.gov.au', url);
} else {
    Dashboard('body', 'http://data.gov.au', '7fbac314-4bf9-4601-b812-0307316ef5a4');
}

// Usually changing the hash doesn't refresh the page, which makes switching
// between examples annoying.
window.onhashchange = function() {
	location.reload();
};
