var svg;
var width = 580, height = 580;
var mapSize = 101;
var xScale = d3.scale.linear().domain([ -mapSize, mapSize ]).range(
		[ 10, width - 20 ]);
var yScale = d3.scale.linear().domain([ mapSize, -mapSize ]).range(
		[ 10, height - 20 ]);
var flScale = d3.scale.quantize().range(
		[ "040", "080", "120", "160", "200", "240", "280", "320", "360" ])
		.domain([ 20, 380 ]);

var beaconSize = {
	width : 7,
	height : 7
};
var planeSpotInfo = {
	"A" : {
		"name" : "plane",
		"width" : 14,
		"height" : 11
	},
	"J" : {
		"name" : "jet",
		"width" : 15,
		"height" : 14
	}
};

function centreNode(size) {
	return "translate(-" + (size.width / 2) + " -" + (size.height / 2) + ")";
}

function rotateNode(c, size) {
	c = (c != null) ? 0 + c : 0;
	return "rotate(" + c + " " + (size.width / 2) + " " + (size.height / 2)
			+ ")";
}

function createNodes(doc, pattern, image, size) {
	var nodes = doc.getElementsByTagName(pattern);
	var gs = svg.selectAll("." + pattern).data(nodes).enter().append("g").attr(
			"class", pattern).attr(
			"transform",
			function(d) {
				return "translate(" + xScale(d.getAttribute("x")) + ","
						+ yScale(d.getAttribute("y")) + ")";
			});
	gs.append("image").attr("xlink:href", image).attr("width", size.width)
			.attr("height", size.height).attr(
					"transform",
					function(d) {
						return centreNode(size) + " "
								+ rotateNode(d.getAttribute("course"), size);
					});
	gs.append("text").text(function(d) {
		return d.id;
	});
}

function findNodeById(node, id) {
	if (node.nodeType == 1) {
		if (node.getAttribute("id") == id)
			return node;
		var n = node.firstElementChild;
		for ( var i = 0; i < node.childElementCount; ++i) {
			var res = findNodeById(n, id);
			if (res != null)
				return res;
			n = n.nextElementSibling;
		}
	}
	return null;
}

function getAttribute(doc, id, attributeName) {
	var value = findNodeById(doc.documentElement, id).getAttribute(
			attributeName);
	return value;
}

function createRoutes(doc) {
	var routes = doc.getElementsByTagName("route");
	svg.selectAll("line").data(routes).enter().append("line").attr("class",
			function(d) {
				var type = d.getAttribute("type");
				return (type != null) ? type : "route";
			}).attr("x1", function(d) {
		return xScale(getAttribute(doc, d.getAttribute("from"), "x"));
	}).attr("y1", function(d) {
		return yScale(getAttribute(doc, d.getAttribute("from"), "y"));
	}).attr("x2", function(d) {
		return xScale(getAttribute(doc, d.getAttribute("to"), "x"));
	}).attr("y2", function(d) {
		return yScale(getAttribute(doc, d.getAttribute("to"), "y"));
	});
}

function initRadarMap(map) {
	svg = d3.select("svg");
	if (svg == null)
		return;
	svg.attr("width", width).attr("height", height);
	d3.xml(map, function(error, doc) {
		if (error != null)
			alert(error);
		else {
			createRoutes(doc);
			createNodes(doc, "beacon", "images/beacon.png", beaconSize);
			createNodes(doc, "exit", "images/entry.png", beaconSize);
			createNodes(doc, "runway", "images/runway.png", beaconSize);
		}
	});
}

function planeToGTrans(p) {
	return "translate(" + xScale(p.x) + " " + yScale(p.y) + ")";
}

function planeToStdFL(p) {
	return flScale(p.flightLevel);
}

function planeToImg(p) {
	var psi = planeSpotInfo[p.classId];
	return "images/" + psi.name + "-" + planeToStdFL(p) + ".png";
}

function planeToImgWidth(p) {
	return planeSpotInfo[p.classId].width;
}

function planeToImgHeight(p) {
	return planeSpotInfo[p.classId].height;
}

function planeToImgTrans(p) {
	var psi = planeSpotInfo[p.classId];
	return centreNode(psi) + " " + rotateNode(p.heading, psi);
}

function filterArray(list, f) {
	var p = new Array();
	for ( var i = 0; i < list.length; ++i) {
		if (f(list[i])) {
			p.push(list[i]);
		}
	}
	return p;
}

function applyToImg(s, d) {
	s.attr("xlink:href", planeToImg(d)).attr("width", planeToImgWidth(d)).attr(
			"height", planeToImgHeight(d)).attr("transform", planeToImgTrans);
}

function paintPlanes(planes) {
	planes = filterArray(planes, function(p) {
		return p.flightLevel != "000";
	});
	planes.sort(function(a, b) {
		return parseInt(a.flightLevel, 10) - parseInt(b.flightLevel, 10);
	});
	var gs = d3.select("svg").selectAll("g.planeSpot").data(planes);
	gs.attr("transform", planeToGTrans);
	gs.enter().append("g").classed("planeSpot", "true").attr("transform",
			planeToGTrans);
	gs.exit().remove();
	gs.each(function(d) {
		var s = d3.select(this).select("line");
		if (s.empty()) {
			s = d3.select(this).append("line");
		}
		var classId = "fl" + planeToStdFL(d);
		s.attr("class", classId).attr("x1", 0).attr("y1", 0).attr("x2", 0)
				.attr("y2", -20 - 10);

		s = d3.select(this).select("text.planeText1");
		if (s.empty()) {
			s = d3.select(this).append("text").classed("planeText1", true)
					.attr("transform", "translate(1 -20)");
		}
		s.attr("class", "planeText1 " + classId).text(d.id + " " + d.classId);

		s = d3.select(this).select("text.planeText2");
		if (s.empty()) {
			s = d3.select(this).append("text").attr("transform",
					"translate(1 -10)");
		}
		s.attr("class", classId + " planeText2").text(
				d.flightLevel + " " + Math.round(d.speed / 10));

		s = d3.select(this).select("image");
		if (s.empty()) {
			s = d3.select(this).append("image");
		}
		applyToImg(s, d);
	});
}