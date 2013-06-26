/*
 * EnteredMessage.java
 *
 * $Id: EnteredMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: EnteredMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class EnteredMessage extends AbstractMessage {
    private String gatewayId;

    /**
         * @param planeId
         * @param gatewayId
         */
    public EnteredMessage(String planeId, String gatewayId) {
	super(planeId);
	this.gatewayId = gatewayId;
    }

    /**
         * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
         */
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
