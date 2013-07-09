<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Air Traffic Control</title>
<link rel="stylesheet" href="css/mainstyle.css" type="text/css"></link>
</head>
<body>
<f:view>
	<h:form>
		<h:panelGrid columns="2" styleClass="main" rowClasses="main"
			columnClasses="main">
			<h:panelGroup>
				<c:import url="homePane.jsp" />
			</h:panelGroup>
			<h:panelGrid>
				<h:panelGrid columns="2">
					<h:outputText value="Level" styleClass="level" />
					<h:outputText value="Radar Map" styleClass="map" />
					<h:selectOneRadio styleClass="level" value="#{userGame.level}"
						layout="pageDirection">
						<f:selectItem itemLabel="Training" itemValue="training" />
						<f:selectItem itemLabel="Easy" itemValue="easy" />
						<f:selectItem itemLabel="Medium" itemValue="medium" />
						<f:selectItem itemLabel="Difficult" itemValue="difficult" />
						<f:selectItem itemLabel="Hard" itemValue="hard" />
					</h:selectOneRadio>
					<h:selectOneRadio styleClass="map" value="#{userGame.map}"
						layout="pageDirection">
						<f:selectItems value="#{userGame.mapList}" />
					</h:selectOneRadio>
				</h:panelGrid>
				<h:commandButton styleClass="button" value="Start simulation"
					action="#{userGame.startGame}" />
				<h:panelGroup>
					<c:import url="hitsPane.jsp" />
				</h:panelGroup>
			</h:panelGrid>
		</h:panelGrid>
	</h:form>
</f:view>
</body>
</html>
