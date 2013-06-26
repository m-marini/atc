/*
 * MessageVisitorAdapter.java
 *
 * $Id: MessageVisitorAdapter.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: MessageVisitorAdapter.java,v 1.1.2.1 2008/01/06 18:29:52 marco
 *          Exp $
 * 
 */
public class MessageVisitorAdapter implements MessageVisitor {

    /**
         * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.TurnToMessage)
         */
    public void visit(TurnToMessage message) {
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.ClearToLandMessage)
         */
    public void visit(ClearToLandMessage message) {
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.ChangeFlightLevelMessage)
         */
    public void visit(ChangeFlightLevelMessage message) {
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.HoldMessage)
         */
    public void visit(HoldMessage message) {
    }

    /**
         * 
         */
    public void visit(InfoMessage message) {
    }

    /**
         * 
         */
    public void visit(CollisionMessage message) {
    }

    /**
         * 
         */
    public void visit(WrongExitMessage message) {
    }

    /**
         * 
         */
    public void visit(RightExitMessage message) {
    }

    /**
         * 
         */
    public void visit(CrashedMessage message) {
    }

    /**
         * 
         */
    public void visit(LandedMessage message) {
    }

    /**
         * 
         */
    public void visit(WrongRunwayMessage message) {
    }

    /**
         * 
         */
    public void visit(EnteredMessage message) {
    }
}
