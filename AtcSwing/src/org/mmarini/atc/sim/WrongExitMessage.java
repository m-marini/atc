/*
 * WrongExitMessage.java
 *
 * $Id: WrongExitMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: WrongExitMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class WrongExitMessage extends AbstractMessage implements Message {

    /**
         * @param planeId
         */
    public WrongExitMessage(String planeId) {
	super(planeId);
    }

    /**
         * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
         */
    public void apply(MessageVisitor visitor) {
	visitor.visit(this);
    }

}
