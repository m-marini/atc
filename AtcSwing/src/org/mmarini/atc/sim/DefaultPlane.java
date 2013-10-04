/*
 * DefaultPlane.java
 *
 * $Id: DefaultPlane.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.text.DecimalFormat;
import java.text.MessageFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: DefaultPlane.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class DefaultPlane implements Plane, AtcConstants {

	private static Logger log = LoggerFactory.getLogger(DefaultPlane.class);

	private DecimalFormat numberFormat = new DecimalFormat("000");

	private String id;

	private int altitude;

	private int expectedAltitude;

	private int heading;

	private Position position = new Position();

	private PlaneModel model;

	private Gateway destination;

	private boolean held;

	private PlaneCommand delayedCommand;

	private Location deleyedCommandLocation;

	private Gateway runway;

	private Position circlePosition = new Position();

	private boolean isCircling;

	/**
         * 
         */
	@Override
	public void applyCircle(Location condition) {
		setRunway(null);
		clearDelayedCommand();
		if (condition == null) {
			circle();
		} else {
			setDelayedCommand(new CircleCommand(this));
			setDeleyedCommandLocation(condition);
		}
	}

	/**
         * 
         */
	@Override
	public void applyFlightLevel(String flightLevelId) {
		int altitude = Integer.parseInt(flightLevelId) * FLIGHT_LEVEL_ID_GAP;
		setExpectedAltitude(altitude);
		setRunway(null);
	}

	/**
         * 
         */
	@Override
	public void applyTurnTo(Location location, Location condition) {
		setRunway(null);
		clearDelayedCommand();
		if (condition == null) {
			turnTo(location);
		} else {
			setDelayedCommand(new TurnToCommand(this, location));
			setDeleyedCommandLocation(condition);
		}
	}

	/**
	 * @return
	 */
	private float calculateSpeed() {
		int h = getAltitude();
		float v0 = getModel().getLowSpeed();
		float vx = getModel().getHighSpeed();
		return h * (vx - v0) / MAX_ALTITUDE + v0;
	}

	/**
         * 
         * 
         */
	public void circle() {
		setRunway(null);
		setCircling(true);
		setCirclePosition(getPosition());
	}

	/**
         * 
         * 
         */
	private void clearDelayedCommand() {
		setDelayedCommand(null);
		setDeleyedCommandLocation(null);
	}

	/**
         * 
         */
	@Override
	public boolean collidesWith(Plane plane) {
		if (this == plane)
			return false;
		if (isHeld() || plane.isHeld())
			return false;
		if (Math.abs(getAltitude() - plane.getAltitude()) > COLLISION_ALTITUDE_RANGE)
			return false;
		if (!getPosition().isInRange(plane.getPosition(), COLLISION_DISTANCE))
			return false;
		return true;
	}

	/**
	 * @return the altitude
	 */
	@Override
	public int getAltitude() {
		return altitude;
	}

	/**
	 * @return the circlePosition
	 */
	private Position getCirclePosition() {
		return circlePosition;
	}

	/**
         * 
         */
	@Override
	public String getClassId() {
		return getModel().getClassId();
	}

	/**
	 * @return the delayedCommand
	 */
	private PlaneCommand getDelayedCommand() {
		return delayedCommand;
	}

	/**
	 * @return the deleyedCommandLocation
	 */
	private Location getDeleyedCommandLocation() {
		return deleyedCommandLocation;
	}

	/**
	 * @return the destination
	 */
	@Override
	public Gateway getDestination() {
		return destination;
	}

	/**
         * 
         */
	@Override
	public String getDestinationId() {
		return getDestination().getId();
	}

	/**
	 * @return the expectedAltitude
	 */
	public int getExpectedAltitude() {
		return expectedAltitude;
	}

	/**
         * 
         */
	@Override
	public String getFlightLevelId() {
		return numberFormat.format(getAltitude() / FLIGHT_LEVEL_ID_GAP);
	}

	/**
	 * @return the heading
	 */
	@Override
	public int getHeading() {
		return heading;
	}

	/**
	 * @return the id
	 */
	@Override
	public String getId() {
		return id;
	}

	/**
	 * @return the model
	 */
	public PlaneModel getModel() {
		return model;
	}

	/**
	 * 
	 * @return
	 */
	private int getPathAltitude() {
		float d = getPosition().getDistance(getRunway().getPosition());
		d = ((float) Math.floor(d / INRANGE_DISTANCE)) * INRANGE_DISTANCE;
		float cicleCount = d / calculateSpeed();
		return Math.min(Math.round(cicleCount * getModel().getVSpeed()),
				LAND_ALTITUDE);
	}

	/**
	 * @return the position
	 */
	@Override
	public Position getPosition() {
		return position;
	}

	/**
	 * @return the runway
	 */
	private Gateway getRunway() {
		return runway;
	}

	/**
         * 
         */
	@Override
	public int getSpeed() {
		return isHeld() ? 0 : Math.round(calculateSpeed() * REAL_SPEED_FACTOR);
	}

	/**
         * 
         */
	@Override
	public String getStatus() {
		StringBuffer bfr = new StringBuffer();
		if (isHeld()) {
			bfr.append("held at " + getRunway().getId());
		} else if (isCircling()) {
			bfr.append("wait in circle");
		} else if (getRunway() != null) {
			bfr.append("landing at " + getRunway().getId());
		} else if (getDeleyedCommandLocation() != null) {
			String ptn = getDelayedCommand().getStatusMessage();
			bfr.append(MessageFormat.format(ptn,
					new Object[] { getDeleyedCommandLocation().getId() }));
		}
		return bfr.toString();
	}

	/**
	 * 
	 * @return
	 */
	private boolean hasPassedDelayedPosition() {
		Location loc = getDeleyedCommandLocation();
		if (loc == null)
			return false;
		Position pos = loc.getPosition();
		if (!isInRange(pos))
			return false;
		int rt = routeTo(pos);
		int dif = Math.abs(hdgDifference(rt));
		return dif >= 90;
	}

	/**
	 * 
	 * @param route
	 * @return
	 */
	private int hdgDifference(int route) {
		int diff = route - getHeading();
		if (diff > 180)
			diff -= 360;
		if (diff < -180)
			diff += 360;
		return diff;
	}

	/**
	 * @return the isCircling
	 */
	private boolean isCircling() {
		return isCircling;
	}

	/**
         * 
         */
	@Override
	public boolean isCorrectExit() {
		return getDestination().isCorrectExit(this);
	}

	/**
         * 
         */
	@Override
	public boolean isCrashed() {
		if (getAltitude() > 0)
			return false;
		if (isHeld())
			return false;
		return !getRunway().isCorrectExit(this);
	}

	/**
         * 
         */
	@Override
	public boolean isExit() {
		return !getPosition().isInRange(RADAR_DISTANCE_RANGE);
	}

	/**
	 * @return the held
	 */
	@Override
	public boolean isHeld() {
		return held;
	}

	/**
	 * @param cmdPos
	 * @return
	 */
	private boolean isInRange(Position cmdPos) {
		return cmdPos.isInRange(getPosition(), INRANGE_DISTANCE);
	}

	/**
         * 
         */
	@Override
	public boolean isInRoute(Position position) {
		int route = routeTo(position);
		return Math.abs(hdgDifference(route)) <= 1;
	}

	/**
         * 
         */
	@Override
	public boolean isLanded() {
		if (getAltitude() > 0)
			return false;
		if (isHeld())
			return false;
		return getRunway().isCorrectExit(this);
	}

	/**
         * 
         */
	@Override
	public void landTo(Gateway location) {
		clearDelayedCommand();
		setRunway(location);
	}

	/**
         * 
         */
	private void move() {
		float speed = calculateSpeed();
		getPosition().move(getHeading(), speed);
		if (getRunway() != null) {
			setExpectedAltitude(getPathAltitude());
		}
		int h = getAltitude();
		int eh = getExpectedAltitude();
		if (h == eh)
			return;
		if (h > eh) {
			h = Math.max(eh, h - getModel().getVSpeed());
		} else {
			h = Math.min(eh, h + getModel().getVSpeed());
		}
		setAltitude(h);
	}

	/**
	 * @param position
	 * @return
	 */
	private int routeTo(Position position) {
		return getPosition().routeTo(position);
	}

	/**
	 * @param altitude
	 *            the altitude to set
	 */
	@Override
	public void setAltitude(int altitude) {
		this.altitude = altitude;
	}

	/**
	 * @param circlePosition
	 *            the circlePosition to set
	 */
	private void setCirclePosition(Position circlePosition) {
		getCirclePosition().setPosition(circlePosition);
	}

	/**
	 * @param isCircling
	 *            the isCircling to set
	 */
	private void setCircling(boolean isCircling) {
		this.isCircling = isCircling;
	}

	/**
	 * @param delayedCommand
	 *            the delayedCommand to set
	 */
	private void setDelayedCommand(PlaneCommand delayedCommand) {
		this.delayedCommand = delayedCommand;
	}

	/**
	 * @param deleyedCommandLocation
	 *            the deleyedCommandLocation to set
	 */
	private void setDeleyedCommandLocation(Location deleyedCommandPosition) {
		this.deleyedCommandLocation = deleyedCommandPosition;
	}

	/**
	 * @param destination
	 *            the destination to set
	 */
	@Override
	public void setDestination(Gateway destination) {
		this.destination = destination;
	}

	/**
	 * @param expectedAltitude
	 *            the expectedAltitude to set
	 */
	@Override
	public void setExpectedAltitude(int expectedAltitude) {
		this.expectedAltitude = expectedAltitude;
	}

	/**
         * 
         */
	@Override
	public void setFlyingStatus() {
		setHeld(false);
	}

	/**
	 * @param heading
	 *            the heading to set
	 */
	@Override
	public void setHeading(int course) {
		this.heading = course;
	}

	/**
	 * @param held
	 *            the held to set
	 */
	private void setHeld(boolean held) {
		this.held = held;
	}

	/**
         * 
         */
	@Override
	public void setHoldingStatus() {
		setHeld(true);
	}

	/**
	 * @param id
	 *            the id to set
	 */
	public void setId(String id) {
		this.id = id;
	}

	/**
	 * @param model
	 *            the model to set
	 */
	public void setModel(PlaneModel model) {
		this.model = model;
	}

	/**
	 * @param position
	 *            the position to set
	 */
	@Override
	public void setPosition(Position position) {
		getPosition().setPosition(position);
	}

	/**
	 * @param runway
	 *            the runway to set
	 */
	@Override
	public void setRunway(Gateway runway) {
		this.runway = runway;
	}

	/**
         * 
         */
	@Override
	public String toString() {
		StringBuffer bfr = new StringBuffer();
		bfr.append(getClass().getName());
		bfr.append("(");
		bfr.append(getId());
		bfr.append(")");
		return bfr.toString();
	}

	/**
	 * 
	 * @param location
	 */
	public void turnTo(Location location) {
		setCircling(false);
		Position position = location.getPosition();
		int hdg = routeTo(position);
		setHeading(hdg);
	}

	/**
         * 
         */
	@Override
	public void update() {
		if (isHeld()) {
			if (getExpectedAltitude() == 0)
				return;
			setFlyingStatus();
		}
		if (hasPassedDelayedPosition()) {
			log.debug("Command position reached");
			getDelayedCommand().apply();
			clearDelayedCommand();
		}
		if (isCircling()) {
			Position position = getCirclePosition();
			if (!getPosition().isInRange(position, CIRCLE_LENGTH)) {
				setHeading(routeTo(position));
			}
		}
		move();
	}

}
