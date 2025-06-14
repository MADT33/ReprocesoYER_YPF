/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ypf/zz1com741_lm4_free2/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
