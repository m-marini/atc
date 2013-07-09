<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="h" uri="http://java.sun.com/jsf/html"%>
<%@ taglib prefix="f" uri="http://java.sun.com/jsf/core"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core"%>
<h:panelGrid styleClass="help" columnClasses="help">
	<h:panelGroup>
		<f:verbatim>
			<h1>GOAL.</h1>

			<p>Your goal is to manoeuver safely the planes in your area.</p>
			<p>You need to:</p>
			<ul>
				<li>take off planes waiting at runways;</li>
				<li>land the planes at destination runways;</li>
				<li>manoeuver the planes out of destination points at altitude
				of 36000 feet.</li>
			</ul>
			<p>The simulation ends when:</p>
			<ul>
				<li>user requests to exit the simulation;</li>
				<li>a plane collinsion is detected, the collision happend when
				the distance between two planes are lower then 4 nautic miles and
				the altitude difference is lower then 1000 feet;</li>
				<li>a wrong destintation is reached;</li>
				<li>a plane crash is reported whenever a plane lands in wrong
				direction.</li>
			</ul>
			<p>Scores are sorted in order of the number of planes safe.
			Suspending a game is not permitted.</p>
		</f:verbatim>
		<h:commandLink value="Select here for more help" action="helpPage" />
		<f:verbatim>
			<h4>Author</h4>
			<p>Marco Marini<br />
			<a href="mailto:marco.marini@mmarini.org">marco.marini@mmarini.org</a>
			<br />
			<a href="http://www.mmarini.org">http://www.mmarini.org</a></p>
		</f:verbatim>
	</h:panelGroup>
</h:panelGrid>
