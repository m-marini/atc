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
	 * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.ChangeFlightLevelMessage)
	 */
	@Override
	public void visit(ChangeFlightLevelMessage message) {
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.ClearToLandMessage)
	 */
	@Override
	public void visit(ClearToLandMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(CollisionMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(CrashedMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(EnteredMessage message) {
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.HoldMessage)
	 */
	@Override
	public void visit(HoldMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(InfoMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(LandedMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(RightExitMessage message) {
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitor#visit(org.mmarini.atc.sim.TurnToMessage)
	 */
	@Override
	public void visit(TurnToMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(WrongExitMessage message) {
	}

	/**
         * 
         */
	@Override
	public void visit(WrongRunwayMessage message) {
	}
}
