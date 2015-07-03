var Dashboard = require('./src/dashboard.js').Dashboard;
var Layout = require('./src/dashboard.js').Layout;

var url = window.location.hash.substr(1);

// Either we are given a dashboard to view
if (url && url.length) {
    var modelUrl = url + '/model.json'
    var layoutUrl = url + '/layout.json'
    Dashboard('body', modelUrl, layoutUrl);
} else {
    Dashboard('body');
}

// Usually changing the hash doesn't refresh the page, which makes switching
// between examples annoying.
window.onhashchange = function() {
	location.reload();
};
