/*
 * Plane.java
 *
 * $Id: Plane.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Plane.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public interface Plane {
	/**
	 * 
	 * @param location
	 */
	public abstract void applyCircle(Location location);

	/**
	 * 
	 * @param flightLevelId
	 */
	public abstract void applyFlightLevel(String flightLevelId);

	/**
	 * 
	 * @param location
	 * @param condition
	 */
	public abstract void applyTurnTo(Location location, Location condition);

	/**
	 * 
	 * @param plane1
	 * @return
	 */
	public abstract boolean collidesWith(Plane plane1);

	/**
	 * 
	 * @return
	 */
	public abstract int getAltitude();

	/**
	 * 
	 * @return
	 */
	public abstract String getClassId();

	/**
	 * 
	 * @return
	 */
	public abstract Gateway getDestination();

	/**
	 * 
	 * @return
	 */
	public abstract String getDestinationId();

	/**
	 * 
	 * @return
	 */
	public abstract String getFlightLevelId();

	/**
	 * 
	 * @return
	 */
	public abstract int getHeading();

	/**
	 * 
	 * @return
	 */
	public abstract String getId();

	/**
	 * 
	 * @return
	 */
	public abstract Position getPosition();

	/**
	 * 
	 * @return
	 */
	public abstract int getSpeed();

	/**
	 * 
	 * @return
	 */
	public abstract String getStatus();

	/**
	 * 
	 * @return
	 */
	public abstract boolean isCorrectExit();

	/**
	 * 
	 * @return
	 */
	public abstract boolean isCrashed();

	/**
	 * 
	 * @return
	 */
	public abstract boolean isExit();

	/**
	 * 
	 * @return
	 */
	public abstract boolean isHeld();

	/**
	 * 
	 * @param position
	 * @return
	 */
	public abstract boolean isInRoute(Position position);

	/**
	 * 
	 * @return
	 */
	public abstract boolean isLanded();

	/**
	 * 
	 * @param location
	 */
	public abstract void landTo(Gateway location);

	/**
	 * 
	 * @param altitude
	 */
	public abstract void setAltitude(int altitude);

	/**
	 * 
	 * @param destination
	 */
	public abstract void setDestination(Gateway destination);

	/**
	 * 
	 * @param entry_altitude
	 */
	public abstract void setExpectedAltitude(int entry_altitude);

	/**
         * 
         * 
         */
	public abstract void setFlyingStatus();

	/**
	 * 
	 * @param course
	 */
	public abstract void setHeading(int course);

	/**
         * 
         * 
         */
	public abstract void setHoldingStatus();

	/**
	 * 
	 * @param position
	 */
	public abstract void setPosition(Position position);

	/**
	 * 
	 * @param runway
	 */
	public abstract void setRunway(Gateway runway);

	/**
         * 
         * 
         */
	public abstract void update();
}
