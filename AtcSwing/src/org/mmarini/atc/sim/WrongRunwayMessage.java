/*
 * WrongRunwayMessage.java
 *
 * $Id: WrongRunwayMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: WrongRunwayMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class WrongRunwayMessage extends AbstractMessage {

	/**
	 * @param planeId
	 */
	public WrongRunwayMessage(String planeId) {
		super(planeId);
	}

	/**
	 * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
	 */
	@Override
	public void apply(MessageVisitor visitor) {
		visitor.visit(this);
	}

}
