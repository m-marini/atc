var sendReq;

var refreshRequest;

var ct=1;

var planeId;

var cmdId;

var flightLevel;

var locationId;
	
var condId;
	
var CMD_FORM_ID	=	"commandForm";

var CANCEL_ID	=	CMD_FORM_ID + "Cancel";

var FL_ID	=	CMD_FORM_ID + "FlightLevel";

var PLANE_TABLE_ID	=	CMD_FORM_ID + ":planeTable";

var CMD_TABLE_ID	=	CMD_FORM_ID + ":commandTable";

var FL_TABLE_ID	=	CMD_FORM_ID + ":flightLevelTable";

var RUNWAY_TABLE_ID	=	CMD_FORM_ID + ":runwayTable";

var LOC_TABLE_ID	=	CMD_FORM_ID + ":locationTable";

var COND_TABLE_ID	=	CMD_FORM_ID + ":conditionTable";

try {
	refreshReq = createRequest();
	refreshReq.onreadystatechange = handleRefreshStateChange;
	sendReq = createRequest();
	refreshReq.onreadystatechange = handleSendStateChange;
} catch (e) { throw e; }

function createRequest() {
	var r = (window.ActiveXObject) ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
	return r;
}

function handleRefreshStateChange() {
	handleStateChange(refreshReq);
}

function handleSendStateChange() {
	handleStateChange(sendReq);
}

function handleStateChange(req) {
	if (req.readyState == 4 && req.status == 200) {
		var obj = eval(req.responseText);
		if (obj!=null) {
			alert(obj);
		}
	}
}

function sendRequest(req, url, handler) {	
	req.open("GET", url, true);
	req.onreadystatechange = handler;
	req.send(null);
}

function findElement(id) {
	var element = document.getElementById(id);
	return element;
}

function disable(id) {
	var cmdPane= findElement(id);
	cmdPane.style.display="none";	
}

function enable(id) {
	var cmdPane= findElement(id);
	cmdPane.style.display="block";	
}

function startGame() {
	callRefresh();
}

function callRefresh() {
	sendRequest(refreshReq, "RefreshServlet?cmd=refresh", handleRefreshStateChange);
}

function callSendMessage(){
}

function refreshMap(){
	form=findElement("radarMap");
	ct++;
	var src="RadarMapServlet?ct="+ct;
	form.src=src;
}

function callRefreshLater() {
	setTimeout("callRefresh()", 1000);
}

function refreshLogPane(data) {
	var p = findElement("logPanel");
	p.innerHTML="";
	
	for (var i=0;i<data.length;++i){
		p.innerHTML+=data[i];
		p.innerHTML+="<br/>";
	}
}

function refreshPlanePane(data) {
	var p = findElement("planePanel");
	var s="";
	for (var i=0;i<data.length;++i){
		s+="  "+data[i]+"<br>";
	}
	p.innerHTML=s;
}

function selectPlane(btn) {
	planeId = btn.value;
	disable(PLANE_TABLE_ID);
	enable(CMD_TABLE_ID);
	return false;
}

function selectFlightLevelCmd() {
	cmdId="callSendFlightLevel()";
	enable(FL_TABLE_ID);
	disable(CMD_TABLE_ID);
	return false;
}

function selectLandCmd() {
	cmdId="callSendLand()";
	disable(CMD_TABLE_ID);
	enable(RUNWAY_TABLE_ID);
	return false;
}

function selectTurnHdgCmd() {
	cmdId="callSendTurn()";
	disable(CMD_TABLE_ID);
	enable(LOC_TABLE_ID);
	return false;
}

function selectHoldCmd(btn) {
	cmdId="callSendHold()";
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
	var n=flightLevel.length;
	flightLevel=flightLevel.substring(n-3,n);
	callSendCmd();
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

function callSendTurn() {
	sendRequest(sendReq, "RefreshServlet?cmd=turn&plane="+planeId+"&location="+locationId+"&condition="+condId, handleSendStateChange);
}

function callSendLand() {
	sendRequest(sendReq, "RefreshServlet?cmd=land&plane="+planeId+"&location="+locationId, handleSendStateChange);
}

function callSendHold() {
	sendRequest(sendReq, "RefreshServlet?cmd=hold&plane="+planeId+"&condition="+condId, handleSendStateChange);
}

function callSendFlightLevel() {
	sendRequest(sendReq, "RefreshServlet?cmd=flightLevel&plane="+planeId+"&flightLevel="+flightLevel, handleSendStateChange);
}

function refreshPlaneButtons(btn) {
	n = btn.length;
	for (var i = 0; i < n; ++i) {
		b=btn[i];
		if (b!=null) {
			var e=findElement(CMD_FORM_ID+":btn"+i);
			e.value=b;
			e.disabled=false;
			e=findElement(CMD_FORM_ID+":txt"+i);
			e.innerHTML=b;
			e.disabled=false;
		}
	}
	for (var i=n; i < 10; ++i) {
		var e=findElement(CMD_FORM_ID+":btn"+i);
		e.value="--";
		e.disabled=true;
		e=findElement(CMD_FORM_ID+":txt"+i);
		e.innerHTML="--";
		e.disabled=true;
	}
}

function callGameOver() {
	document.location="endGamePage.faces";
}

function exitGame() {
	sendRequest(sendReq, "RefreshServlet?cmd=exitGame", handleSendStateChange);
}