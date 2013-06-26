/*
 * MessageVisitor.java
 *
 * $Id: MessageVisitor.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: MessageVisitor.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public interface MessageVisitor {
    /**
         * 
         * @param message
         */
    public abstract void visit(TurnToMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(ClearToLandMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(ChangeFlightLevelMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(HoldMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(InfoMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(CollisionMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(WrongExitMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(RightExitMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(CrashedMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(LandedMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(WrongRunwayMessage message);

    /**
         * 
         * @param message
         */
    public abstract void visit(EnteredMessage message);

}
