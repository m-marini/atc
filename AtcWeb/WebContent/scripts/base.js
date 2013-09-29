var planeId;
var cmdId;
var flightLevel;
var locationId;
var condId;
var CMD_FORM_ID = "commandForm";
var CANCEL_ID = CMD_FORM_ID + "Cancel";
var FL_ID = CMD_FORM_ID + "FlightLevel";
var PLANE_TABLE_ID = CMD_FORM_ID + ":planeTable";
var CMD_TABLE_ID = CMD_FORM_ID + ":commandTable";
var FL_TABLE_ID = CMD_FORM_ID + ":flightLevelTable";
var RUNWAY_TABLE_ID = CMD_FORM_ID + ":runwayTable";
var LOC_TABLE_ID = CMD_FORM_ID + ":locationTable";
var COND_TABLE_ID = CMD_FORM_ID + ":conditionTable";
var refreshInterval = 1000;

function findElement(id) {
	var element = document.getElementById(id);
	return element;
}

function disable(id) {
	var cmdPane = findElement(id);
	cmdPane.style.display = "none";
}

function enable(id) {
	var cmdPane = findElement(id);
	cmdPane.style.display = "block";
}

function startGame(map) {
	initRadarMap(map);
	refreshAll();
}

function manageResponse(err, response) {
	if (err != null) {
		alert(err);
	} else {
		refreshPlaneButtons(response.planeList);
		paintPlanes(response.planeList);
		refreshTextPane("#planePanel", response.planePane);
		refreshTextPane("#logPanel", response.logPane);
		if (response.command != null)
			eval(response.command);
	}
}

function refreshAll() {
	d3.json("RefreshServlet?cmd=refresh", manageResponse);
}

function refreshLater() {
	setTimeout("refreshAll()", refreshInterval);
}

function it(d) {
	return d;
}

function refreshTextPane(panelId, logData) {
	d3.select(panelId).selectAll("span").remove();
	var logs = d3.select(panelId).selectAll("span").data(logData).text(it);
	logs.enter().append("span").text(it).append("br");
	logs.exit().remove();
}

function selectPlane(plane) {
	planeId = plane.id;
	disable(PLANE_TABLE_ID);
	enable(CMD_TABLE_ID);
	d3.event.preventDefault();
}

function selectFlightLevelCmd() {
	enable(FL_TABLE_ID);
	disable(CMD_TABLE_ID);
	return false;
}

function selectLandCmd() {
	cmdId = "landPlane()";
	disable(CMD_TABLE_ID);
	enable(RUNWAY_TABLE_ID);
	return false;
}

function selectTurnHdgCmd() {
	cmdId = "turnPlane()";
	disable(CMD_TABLE_ID);
	enable(LOC_TABLE_ID);
	return false;
}

function selectHoldCmd(btn) {
	cmdId = "holdOnPlane()";
	enable(COND_TABLE_ID);
	disable(CMD_TABLE_ID);
	return false;
}

function selectCancel() {
	enable(PLANE_TABLE_ID);
	disable(CMD_TABLE_ID);
	disable(FL_TABLE_ID);
	disable(RUNWAY_TABLE_ID);
	disable(COND_TABLE_ID);
	disable(LOC_TABLE_ID);
	return false;
}

function selectFlightLevel(btn) {
	flightLevel = btn.id;
	var n = flightLevel.length;
	flightLevel = flightLevel.substring(n - 3, n);
	changeFlightLevel();
	selectCancel();
	return false;
}

function selectLocation(btn) {
	locationId = btn;
	enable(COND_TABLE_ID);
	disable(LOC_TABLE_ID);
	return false;
}

function selectCondition(cond) {
	condId = cond;
	callSendCmd();
	selectCancel();
	return false;
}

function selectRunway(btn) {
	locationId = btn;
	callSendCmd();
	selectCancel();
	return false;
}

function callSendCmd() {
	eval(cmdId);
}

function turnPlane() {
	d3.json("RefreshServlet?cmd=turn&plane=" + planeId + "&location="
			+ locationId + "&condition=" + condId, manageResponse);
}

function landPlane() {
	d3.json("RefreshServlet?cmd=land&plane=" + planeId + "&location="
			+ locationId, manageResponse);
}

function holdOnPlane() {
	d3
			.json("RefreshServlet?cmd=hold&plane=" + planeId + "&condition="
					+ condId, manageResponse);
}

function changeFlightLevel() {
	d3.json("RefreshServlet?cmd=flightLevel&plane=" + planeId + "&flightLevel="
			+ flightLevel, manageResponse);
}

function refreshPlaneButtons(planeList) {
	var bs = d3.selectAll("input.planeButton").data(planeList).on("click",
			selectPlane).attr("disabled", null);
	bs.exit().on("click", null).attr("disabled", "disabled");
	bs = d3.selectAll("span.planeButton").data(planeList).text(function(p) {
		return p.id;
	});
	bs.exit().text("--");
}

function setGameOver() {
	document.location = "endGamePage.faces";
}

function exitGame() {
	d3.json("RefreshServlet?cmd=exitGame", manageResponse);
}