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
<script language="javascript" type="text/javascript" src="base.js"></script>
<link rel="stylesheet" href="style.css" type="text/css"></link>
</head>
<body>
<f:view>
	<h:dataTable var="row" value="#{userGame.logRows}">
		<h:column>
			<h:outputText value="#{row}" />
		</h:column>
	</h:dataTable>
</f:view>
</body>
</html>
