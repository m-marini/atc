/*
 * TurnToMessage.java
 *
 * $Id: TurnToMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: TurnToMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class TurnToMessage extends AbstractConditionMessage {
    private String locationId;

    /**
         * @return the locationId
         */
    public String getLocationId() {
	return locationId;
    }

    /**
         * @param locationId
         *                the locationId to set
         */
    public void setLocationId(String locationId) {
	this.locationId = locationId;
    }

    /**
         * 
         */
    public void apply(MessageVisitor visitor) {
	visitor.visit(this);
    }
}
