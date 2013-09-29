<?xml version="1.0" encoding="ISO-8859-1" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
<title>Insert title here</title>
<script type="text/javascript" src="scripts/d3.v3.min.js"></script>
<script type="text/javascript" src="scripts/base.js"></script>
<script type="text/javascript" src="scripts/radarMap.js"></script>
<script type="text/javascript">
var mapUrl = "<c:out value='${userGame.mapUrl}' />"
</script>
<link rel="stylesheet" href="css/style.css" type="text/css"></link>
<link rel="stylesheet" href="css/radarMap.css" type="text/css"></link>
</head>
<body onload="javascript:startGame(mapUrl);">
	<!-- 
<embed id="sound" src="filename.ext" width="0" height="0" autoplay="true" hidden="true" loop="false" volume="1-100"></embed>
 -->
	<f:view>
		<h:panelGrid columns="3" styleClass="atcPanel"
			columnClasses="atcPanel,actPanel,atcPanel" rowClasses="atcPanel">
			<h:panelGrid styleClass="leftAtcPanel" columnClasses="leftAtcPanel"
				rowClasses="planePane,logPane">
				<f:verbatim>
					<div id="planePanel" class="planePane" />
				</f:verbatim>
				<f:verbatim>
					<div id="logPanel" class="logPane" />
				</f:verbatim>
			</h:panelGrid>
			<f:verbatim>
				<svg xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink" />
			</f:verbatim>
			<h:panelGrid styleClass="rightActPane"
				rowClasses="upperRightPane,centerRightPane,bottomRightPane"
				columnClasses="rightActPane">
				<h:commandButton onclick="selectCancel()" image="images/cancel.png" />
				<h:panelGroup>
					<c:import url="buttonPane.jsp" />
				</h:panelGroup>
				<h:commandButton onclick="exitGame()" image="images/exit.png" />
			</h:panelGrid>
		</h:panelGrid>
	</f:view>
</body>
</html>
