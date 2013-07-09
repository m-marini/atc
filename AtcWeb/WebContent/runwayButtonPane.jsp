<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<h:dataTable id="runwayTable" styleClass="hiddenPanel" var="runway"
	value="#{userGame.runwayList}">
	<h:column>
		<h:commandButton onclick="return selectRunway('#{runway}');"
			image="images/button.png" />
	</h:column>
	<h:column>
		<h:outputText styleClass="buttonLabel" value="#{runway}" />
	</h:column>
</h:dataTable>
