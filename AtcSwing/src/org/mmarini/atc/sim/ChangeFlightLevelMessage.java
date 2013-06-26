/*
 * ChangeFlightLevelMessage.java
 *
 * $Id: ChangeFlightLevelMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: ChangeFlightLevelMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class ChangeFlightLevelMessage extends AbstractMessage {
    private String flightLevelId;

    /**
         * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
         */
    public void apply(MessageVisitor visitor) {
	visitor.visit(this);
    }

    /**
         * @return the flightLevelId
         */
    public String getFlightLevelId() {
	return flightLevelId;
    }

    /**
         * @param flightLevelId
         *                the flightLevelId to set
         */
    public void setFlightLevelId(String flightLevelId) {
	this.flightLevelId = flightLevelId;
    }

}
