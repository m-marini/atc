/*
 * PlaneModel.java
 *
 * $Id: PlaneModel.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneModel.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class PlaneModel {
	private String classId;

	private float lowSpeed;

	private float highSpeed;

	private int vSpeed;

	/**
	 * @return the classId
	 */
	public String getClassId() {
		return classId;
	}

	/**
	 * @return the highSpeed
	 */
	public float getHighSpeed() {
		return highSpeed;
	}

	/**
	 * @return the lowSpeed
	 */
	public float getLowSpeed() {
		return lowSpeed;
	}

	/**
	 * @return the vSpeed
	 */
	public int getVSpeed() {
		return vSpeed;
	}

	/**
	 * @param classId
	 *            the classId to set
	 */
	public void setClassId(String classId) {
		this.classId = classId;
	}

	/**
	 * @param highSpeed
	 *            the highSpeed to set
	 */
	public void setHighSpeed(float highSpeed) {
		this.highSpeed = highSpeed;
	}

	/**
	 * @param lowSpeed
	 *            the lowSpeed to set
	 */
	public void setLowSpeed(float speed) {
		this.lowSpeed = speed;
	}

	/**
	 * @param lowSpeed
	 *            the vSpeed to set
	 */
	public void setVSpeed(int speed) {
		vSpeed = speed;
	}

}
