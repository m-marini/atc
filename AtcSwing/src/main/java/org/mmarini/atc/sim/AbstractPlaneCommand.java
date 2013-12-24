/*
 * AbstractPlaneCommand.java
 *
 * $Id: AbstractPlaneCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 07/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AbstractPlaneCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 */
public abstract class AbstractPlaneCommand implements PlaneCommand {
	private DefaultPlane plane;

	/**
	 * 
	 * @param plane
	 */
	protected AbstractPlaneCommand(DefaultPlane plane) {
		this.plane = plane;
	}

	/**
	 * @return the plane
	 */
	protected DefaultPlane getPlane() {
		return plane;
	}
}
