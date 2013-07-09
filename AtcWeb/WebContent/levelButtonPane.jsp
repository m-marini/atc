<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<h:panelGrid id="flightLevelTable" styleClass="hiddenPanel" columns="2">
	<h:commandButton id="FL360" value="FL360"
		onclick="return selectFlightLevel(this);"
		image="images/fl360Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL360" />
	<h:commandButton id="FL320" value="FL320"
		onclick="return selectFlightLevel(this);"
		image="images/fl320Button.png"  />
	<h:outputText styleClass="buttonLabel"  value="FL320" />
	<h:commandButton id="FL280" value="FL280"
		onclick="return selectFlightLevel(this);"
		image="images/fl280Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL280" />
	<h:commandButton id="FL240" value="FL240"
		onclick="return selectFlightLevel(this);"
		image="images/fl240Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL240" />
	<h:commandButton id="FL200" value="FL200"
		onclick="return selectFlightLevel(this);"
		image="images/fl200Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL200" />
	<h:commandButton id="FL160" value="FL160"
		onclick="return selectFlightLevel(this);" 
		image="images/fl160Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL160" />
	<h:commandButton id="FL120" value="FL120"
		onclick="return selectFlightLevel(this);"
		image="images/fl120Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL120" />
	<h:commandButton id="FL080" value="FL080"
		onclick="return selectFlightLevel(this);"
		image="images/fl080Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL080" />
	<h:commandButton id="FL040" value="FL040"
		onclick="return selectFlightLevel(this);"
		image="images/fl040Button.png" />
	<h:outputText styleClass="buttonLabel"  value="FL040" />
</h:panelGrid>
