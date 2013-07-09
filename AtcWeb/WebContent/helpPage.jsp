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
<link rel="stylesheet" href="css/mainstyle.css" type="text/css"></link>
</head>
<body>
<f:view>
	<h:form>
		<h:panelGrid styleClass="help" columnClasses="help">
			<h:commandLink value="Home" action="gamePage" />
			<f:verbatim>
				<h1>DISPLAY HELP</h1>

				<p>The screen will be divided into 4 areas.</p>

				<h3>The Information Area</h3>
				<p>The left upper screen area is the information area, which
				lists the planes currently in the air. Each entry shows the plane
				name and class, its current flight level (x100 feet), the plane's
				destination, and the plane's current command. Changing altitude is
				not considered to be a command and is therefore not displayed.</p>

				<h3>The Log Area</h3>
				<p>The left lower screen area is the log area, which lists the
				last ten events occurred in the simulation. It registers the command
				send to plane, the response to the command, the entry or exit of
				planes in the radar area.</p>

				<h3>The Radar Map</h3>
				<p>The center screen area is the radar display, showing the
				relative locations of the planes, airports, standard entry/exit
				points, radar beacons, and "lines" which simply serve to aid you in
				guiding the planes.</p>
				<p>Planes are shown as a icon and flight information. The
				information are two alphanumeric rows:</p>
				<ul>
					<li>the first row is the plane id (two alphanumeric chars) and
					plane class (A is props plane and J is jet plane).</li>
					<li>the second row is the flight information the first three
					numeric chars are the flight level (x100 feet) and the other
					numeric chars are the speed (x10 knots).</li>
				</ul>
				<p>Airports are shown as a number indicating the direction of
				runway (x10 degrees). The planes will land and take off in this
				direction.</p>
				<p>Beacons are represented as circles a chars identifier. Their
				purpose is to offer a place of easy reference to the plane pilots.</p>
				<p>Entry/exit points are displayed as the beacons but along the
				border of the radar screen. Planes will enter the arena from these
				points without warning. These points have a direction associated
				with them, and planes will always enter the arena from this
				direction.This direction is displayed as a light line. Incoming
				planes will always enter at the same altitude: 28000 feet. For a
				plane to successfully depart through an entry/exit point, it must be
				flying at 36000 feet. It is not necessary for the planes to be
				flying in any particular direction when they leave the arena.</p>

				<h3>The Input Area</h3>
				<p>The third area of the display is the input area. It is here
				that your input is reflected.A command completion interface is built
				into the simulator.</p>
				<p>The command are created using button panels the allow the
				user to send the command to the plane.</p>
				<p>The first panel is a list of buttons for each plane. Pressing
				the enabled button you select the command destination plane.</p>
				<p>The second panel is the command panel. You may select one of
				the four command available:</p>
				<ul>
					<li>Change flight level: tell a plane to change his flight
					level, a waiting plane at runway can take off sending a change
					flight level commmand;</li>
					<li>Turn heading: tell a plane to change the heading of plane;</li>
					<li>Clear to land: tell a plane to land at a runway;</li>
					<li>Hold in circle: tell a plane to wait in circle;</li>
				</ul>
				<p>Depending on the selected comand the thrid panel is shown:</p>
				<p>Selecting the change flight level command, the flight level
				command panel is showns and it allows to select one of 9 flight
				level available.</p>
				<p>Selecting the Turn heading command the destination panel is
				shown. It allows to select one of the available destination for the
				current map.</p>
				<p>The turn heading command can be triggered when the plane pass
				on a checkpoint. After you select the destination the condition pane
				appears and allows to select the checkpoint condition or to execute
				the command immediately.</p>
				<p>Selecting the clear to land command, the runway panel is
				shown. It allows to select one of the destination runway. The clear
				to land command as change flight level is an immediate command so
				there is no more panel shown after them.</p>
				<p>Selecting the hold in circle, the condition panel is shown as
				in turn heading command.</p>
				<h1>Credits</h1>
				<p>The game is based on the ATC Game for Linux by Ed James, UC
				Berkeley: edjames@ucbvax.berkeley.edu, ucbvax!edjames.</p>
			</f:verbatim>
			<h:commandLink value="Home" action="gamePage" />
		</h:panelGrid>
	</h:form>
</f:view>
</body>
</html>
