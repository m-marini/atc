/*
 * CommandController.java
 *
 * $Id: CommandController.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 05/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: CommandController.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public interface CommandController {

	/**
         * 
         * 
         */
	public abstract void cancel();

	/**
	 * 
	 * @param commandId
	 */
	public abstract void notifyCommandSelection(String commandId);

	/**
	 * 
	 * @param flightLevel
	 */
	public abstract void notifyFlightLevelSelection(String flightLevel);

	/**
	 * 
	 * @param locationId
	 */
	public abstract void notifyLocationSelection(String locationId);

	/**
	 * 
	 * @param planeId
	 */
	public abstract void notifyPlaneSelection(String planeId);
}
