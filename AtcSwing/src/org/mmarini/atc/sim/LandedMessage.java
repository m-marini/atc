/*
 * LandedMessage.java
 *
 * $Id: LandedMessage.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: LandedMessage.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class LandedMessage extends AbstractMessage implements Message {
	private String gatewayId;

	/**
	 * 
	 * @param planeId
	 * @param gatewayId
	 */
	public LandedMessage(String planeId, String gatewayId) {
		super(planeId);
		this.gatewayId = gatewayId;
	}

	/**
	 * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
	 */
	@Override
	public void apply(MessageVisitor visitor) {
		visitor.visit(this);
	}

	/**
	 * @return the gatewayId
	 */
	public String getGatewayId() {
		return gatewayId;
	}

}
