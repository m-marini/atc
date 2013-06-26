/*
 * SessionParameters.java
 *
 * $Id: GameProfile.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: GameProfile.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class GameProfile {
	private double newPlaneProbability;

	private int maxPlane;

	private String id;

	/**
	 * @return the newPlaneProbability
	 */
	public double getNewPlaneProbability() {
		return newPlaneProbability;
	}

	/**
	 * @param newPlaneProbability
	 *            the newPlaneProbability to set
	 */
	public void setNewPlaneProbability(double newPlaneProbability) {
		this.newPlaneProbability = newPlaneProbability;
	}

	/**
	 * @return the maxPlane
	 */
	public int getMaxPlane() {
		return maxPlane;
	}

	/**
	 * @param maxPlane
	 *            the maxPlane to set
	 */
	public void setMaxPlane(int maxPlane) {
		this.maxPlane = maxPlane;
	}

	/**
	 * 
	 * @return
	 */
	public String getId() {
		return id;
	}

	/**
	 * @param id
	 *            the id to set
	 */
	public void setId(String id) {
		this.id = id;
	}

}
