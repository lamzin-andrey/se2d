window.getViewport = function() {
	var W = window, D = document, w = W.innerWidth, h = W.innerHeight;
	if (!w && D.documentElement && D.documentElement.clientWidth) {
		w = D.documentElement.clientWidth;
	} else if (!w) {
		w = D.getElementsByTagName('body')[0].clientWidth;
	}
	if (!h && D.documentElement && D.documentElement.clientHeight) {
		h = D.documentElement.clientHeight;
	} else if (!h) {
		h = D.getElementsByTagName('body')[0].clientHeight;
	}
	return {w:w, h:h};
}
window.trace = function(s) {
	var d = document.getElementById('trace');
	if (d) {
		d.innerHTML = s;
		return;
	}
	if (console && console.log) {
		console.log(s);
		return;
	}
	alert(s);
}
