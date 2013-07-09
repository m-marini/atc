<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<h:panelGroup>
	<h:outputText styleClass="hits" value="Hits" />
	<h:dataTable var="record" value="#{hitsBean.table}" styleClass="hits"
		columnClasses="hitsId,hitsPlane,hitsProfile,hitsTime,hitsMapName">
		<h:column>
			<f:facet name="header">
				<h:outputText value="Name" />
			</f:facet>
			<h:outputText value="#{record.name}" />
		</h:column>
		<h:column>
			<f:facet name="header">
				<h:outputText value="Score" />
			</f:facet>
			<h:outputText value="#{record.planeCount}">
				<f:convertNumber integerOnly="true" />
			</h:outputText>
		</h:column>
		<h:column>
			<f:facet name="header">
				<h:outputText value="Level" />
			</f:facet>
			<h:outputText value="#{record.profile}" />
		</h:column>
		<h:column>
			<f:facet name="header">
				<h:outputText value="Date" />
			</f:facet>
			<h:outputText value="#{record.date}">
				<f:convertDateTime pattern="d.MM.yy hh:MM" />
			</h:outputText>
		</h:column>
		<h:column>
			<f:facet name="header">
				<h:outputText value="Map" />
			</f:facet>
			<h:outputText value="#{record.mapName}" />
		</h:column>
	</h:dataTable>
</h:panelGroup>
