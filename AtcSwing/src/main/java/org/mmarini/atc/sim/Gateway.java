/*
 * Gateway.java
 *
 * $Id: Gateway.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Gateway.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public interface Gateway extends Location {
	/**
	 * 
	 * @return
	 */
	public abstract int getCourse();

	/**
	 * 
	 * @param plane
	 * @return
	 */
	public abstract void initPlane(Plane plane);

	/**
	 * 
	 * @return
	 */
	public abstract boolean isBusy();

	/**
	 * 
	 * @param plane
	 * @return
	 */
	public abstract boolean isCorrectExit(Plane plane);
}
