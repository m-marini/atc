/*
 * CrashedMessage.java
 *
 * $Id: CrashedMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: CrashedMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class CrashedMessage extends AbstractMessage implements Message {
    /**
         * @param planeId
         */
    public CrashedMessage(String planeId) {
	super(planeId);
    }

    /**
         * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
         */
    public void apply(MessageVisitor visitor) {
	visitor.visit(this);
    }

}
