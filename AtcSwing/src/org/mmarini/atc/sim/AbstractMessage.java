/*
 * AbstractMessage.java
 *
 * $Id: AbstractMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AbstractMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public abstract class AbstractMessage implements Message {

	private String planeId;

	/**
         * 
         */
	public AbstractMessage() {
	}

	/**
	 * @param planeId
	 */
	public AbstractMessage(String planeId) {
		this.planeId = planeId;
	}

	/**
	 * @return the planeId
	 */
	public String getPlaneId() {
		return planeId;
	}

	/**
	 * @param planeId
	 *            the planeId to set
	 */
	public void setPlaneId(String planeId) {
		this.planeId = planeId;
	}
}
