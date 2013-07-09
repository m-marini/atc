<%@ page language="java" contentType="text/javascript; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
refreshLogPane([
<c:set var="first" value="${true}" />
<c:forEach var="text" items="${userGame.logRows}">
<c:choose><c:when test="${first}"><c:set var="first" value="${false}"/></c:when><c:otherwise>,</c:otherwise></c:choose>
"<c:out value="${text}" />"
</c:forEach>
]);