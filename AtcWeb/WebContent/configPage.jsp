<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>ATC</title>
<link rel="stylesheet" href="css/mainstyle.css" type="text/css"></link>
</head>
<body>
<f:view>
	<h:form>
		<h:outputLabel value="Password" />
		<h:inputSecret value="#{configBean.password}" />
		<h:commandButton value="Test Database"
			action="#{configBean.testDatabase}" />
		<h:commandButton value="Create Table"
			action="#{configBean.createTables}" />
		<h:outputLabel value="Test Result" />
		<h:outputText value="#{configBean.testResult}" />
	</h:form>
</f:view>
</body>
</html>
