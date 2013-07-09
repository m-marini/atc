<?xml version="1.0" encoding="ISO-8859-1" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
<title>Insert title here</title>
<link rel="stylesheet" href="css/mainstyle.css" type="text/css"></link>
</head>
<body>
<f:loadBundle basename="org.mmarini.atc.jsf.Messages" var="messages" />
<f:view>
	<h:form>
		<h:panelGrid styleClass="extEndGame">
			<h:outputText value="#{messages[userGame.endGameReason]}" />
			<h:outputText value="Record" />
			<h:panelGrid styleClass="endGame" columns="2">
				<h:outputLabel value="Name" />
				<h:inputText value="#{userGame.record.name}"
					disabled="#{!userGame.betterRecord}" maxlength="10" size="10">
				</h:inputText>
				<h:outputLabel value="Score" />
				<h:outputText value="#{userGame.record.planeCount}">
					<f:convertNumber integerOnly="true" />
				</h:outputText>
				<h:outputLabel value="Date" />
				<h:outputText value="#{userGame.record.date}">
					<f:convertDateTime pattern="dd MMM yyyy hh:MM" />
				</h:outputText>
				<h:outputLabel value="Elapsed" />
				<h:outputText value="#{userGame.record.iterationCount}">
					<f:convertNumber integerOnly="true" />
				</h:outputText>
			</h:panelGrid>
			<h:commandButton value="OK" action="#{userGame.register}" />
		</h:panelGrid>
	</h:form>
</f:view>
</body>
</html>
