<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<h:panelGrid id="commandTable" styleClass="hiddenPanel" columns="2">
	<h:commandButton id="FlightLevel"
		onclick="return selectFlightLevelCmd();" image="images/button.png" />
	<h:outputText styleClass="buttonLabel" value="Flight Level" />
	<h:commandButton id="TurnHeading" onclick="return selectTurnHdgCmd();"
		image="images/button.png" />
	<h:outputText styleClass="buttonLabel" value="Turn Heading" />
	<h:commandButton id="ClearToLand" onclick="return selectLandCmd();"
		image="images/button.png" />
	<h:outputText styleClass="buttonLabel" value="Clear To Land" />
	<h:commandButton id="HoldInCircle" onclick="return selectHoldCmd();"
		image="images/button.png" />
	<h:outputText styleClass="buttonLabel" value="Hold In Circle" />
</h:panelGrid>
