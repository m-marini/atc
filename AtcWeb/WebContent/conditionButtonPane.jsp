<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<h:panelGrid id="conditionTable" styleClass="hiddenPanel">
	<h:panelGrid columns="2">
		<h:commandButton onclick="return selectCondition('Immediate');"
			image="images/button.png" />
		<h:outputText styleClass="buttonLabel" value="Immediate" />
	</h:panelGrid>
	<h:panelGrid columns="2">
		<h:dataTable var="location" value="#{userGame.locationList}" first="0"
			rows="10">
			<h:column>
				<h:commandButton onclick="return selectCondition('#{location}');"
					image="images/button.png" />
			</h:column>
			<h:column>
				<h:outputText styleClass="buttonLabel" value="#{location}" />
			</h:column>
		</h:dataTable>
		<h:dataTable var="location" value="#{userGame.locationList}"
			first="10">
			<h:column>
				<h:commandButton onclick="return selectCondition('#{location}');"
					image="images/button.png" />
			</h:column>
			<h:column>
				<h:outputText styleClass="buttonLabel" value="#{location}" />
			</h:column>
		</h:dataTable>
	</h:panelGrid>
</h:panelGrid>
