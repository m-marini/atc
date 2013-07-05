/*
 * CollisionMessage.java
 *
 * $Id: CollisionMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: CollisionMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class CollisionMessage implements Message {
	private String plane0;

	private String plane1;

	/**
	 * @param plane0
	 * @param plane1
	 */
	public CollisionMessage(String plane0, String plane1) {
		this.plane0 = plane0;
		this.plane1 = plane1;
	}

	/**
	 * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
	 */
	@Override
	public void apply(MessageVisitor visitor) {
		visitor.visit(this);
	}

	/**
	 * @return the plane0
	 */
	public String getPlane0() {
		return plane0;
	}

	/**
	 * @return the plane1
	 */
	public String getPlane1() {
		return plane1;
	}

}
