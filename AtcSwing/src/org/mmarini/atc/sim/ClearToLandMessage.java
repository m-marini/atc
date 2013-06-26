/*
 * ClearToLandMessage.java
 *
 * $Id: ClearToLandMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: ClearToLandMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class ClearToLandMessage extends AbstractMessage {
    private String locationId;

    /**
         * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
         */
    public void apply(MessageVisitor visitor) {
	visitor.visit(this);
    }

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

}
