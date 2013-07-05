/*
 * TurnToCommand.java
 *
 * $Id: TurnToCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 07/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: TurnToCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class TurnToCommand extends AbstractPlaneCommand {
	private Location location;

	/**
	 * @param plane
	 * @param location
	 */
	public TurnToCommand(DefaultPlane plane, Location location) {
		super(plane);
		this.location = location;
	}

	/**
	 * @see org.mmarini.atc.sim.PlaneCommand#apply()
	 */
	@Override
	public void apply() {
		getPlane().turnTo(getLocation());
	}

	/**
	 * @return the location
	 */
	public Location getLocation() {
		return location;
	}

	/**
         * 
         */
	@Override
	public String getStatusMessage() {
		return "turn to " + getLocation().getId() + " at {0}";
	}

}
