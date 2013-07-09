<%@ page language="java" contentType="text/javascript; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
refreshPlaneButtons([
<c:set var="first" value="${true}" />
<c:forEach var="plane" items="${userGame.planeList}">
<c:choose><c:when test="${first}"><c:set var="first" value="${false}"/></c:when><c:otherwise>,</c:otherwise></c:choose>
"<c:out value="${plane.id}" />"
</c:forEach>
]);
refreshMap();
refreshPlanePane([
<c:set var="first" value="${true}" />
<c:forEach var="text" items="${userGame.planeListLog}">
<c:choose><c:when test="${first}"><c:set var="first" value="${false}"/></c:when><c:otherwise>,</c:otherwise></c:choose>
"<c:out value="${text}" />"
</c:forEach>
]);
<c:import url="refreshLogPane.jsp"/>
<c:choose><c:when test="${userGame.gameOver}">callGameOver();</c:when>
<c:otherwise>callRefreshLater();</c:otherwise> </c:choose>