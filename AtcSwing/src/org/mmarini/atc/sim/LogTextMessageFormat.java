/*
 * LogTextMessageFormatter.java
 *
 * $Id: LogTextMessageFormat.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.text.MessageFormat;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: LogTextMessageFormat.java,v 1.1.2.1 2008/01/06 21:11:10 marco
 *          Exp $
 * 
 */
public class LogTextMessageFormat extends MessageVisitorAdapter implements
	MessageConsumer {
    private Logger logger;

    private String text;

    /**
         * 
         */
    public LogTextMessageFormat() {
    }

    /**
         * @param logger
         */
    public LogTextMessageFormat(Logger logger) {
	this.logger = logger;
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.ChangeFlightLevelMessage)
         */
    @Override
    public void visit(ChangeFlightLevelMessage message) {
	String ptn = "{0} flight level {1}";
	String txt = MessageFormat.format(ptn, new Object[] {
		message.getPlaneId(), message.getFlightLevelId() });
	setText(txt);
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.ClearToLandMessage)
         */
    @Override
    public void visit(ClearToLandMessage message) {
	String ptn = "{0} clear to land runway {1}";
	String txt = MessageFormat.format(ptn, new Object[] {
		message.getPlaneId(), message.getLocationId() });
	setText(txt);
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.HoldMessage)
         */
    @Override
    public void visit(HoldMessage message) {
	String ptn;
	if (message.getConditionId() == null) {
	    ptn = "{0} hold in circle";
	} else {
	    ptn = "{0} hold in circle at {1}";
	}
	String txt = MessageFormat.format(ptn, new Object[] {
		message.getPlaneId(), message.getConditionId() });
	setText(txt);
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.TurnToMessage)
         */
    @Override
    public void visit(TurnToMessage message) {
	String ptn;
	if (message.getConditionId() == null) {
	    ptn = "{0} turn to {1}";
	} else {
	    ptn = "{0} turn to {1} at {2}";
	}
	String txt = MessageFormat.format(ptn, new Object[] {
		message.getPlaneId(), message.getLocationId(),
		message.getConditionId() });
	setText(txt);
    }

    /**
         * @param text
         *                the text to set
         */
    private void setText(String text) {
	this.text = text;
    }

    /**
         * @return the text
         */
    public String getText() {
	return text;
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.InfoMessage)
         */
    @Override
    public void visit(InfoMessage message) {
	setText(message.getMessage());
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.CollisionMessage)
         */
    @Override
    public void visit(CollisionMessage message) {
	setText("Collision between " + message.getPlane0() + " and "
		+ message.getPlane1());
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.CrashedMessage)
         */
    @Override
    public void visit(CrashedMessage message) {
	setText(message.getPlaneId() + " crashed");
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.EnteredMessage)
         */
    @Override
    public void visit(EnteredMessage message) {
	setText(message.getPlaneId() + " entered at " + message.getGatewayId());
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.LandedMessage)
         */
    @Override
    public void visit(LandedMessage message) {
	setText(message.getPlaneId() + " landed successfully");
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.RightExitMessage)
         */
    @Override
    public void visit(RightExitMessage message) {
	setText(message.getPlaneId() + " exited successfully");
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.WrongExitMessage)
         */
    @Override
    public void visit(WrongExitMessage message) {
	setText(message.getPlaneId() + " exited at wrong way");
    }

    /**
         * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.WrongRunwayMessage)
         */
    @Override
    public void visit(WrongRunwayMessage message) {
	setText(message.getPlaneId() + " landed at wrong runway");
    }

    /**
         * 
         */
    public void consume(Message message) {
	setText(message.toString());
	message.apply(this);
	getLogger().log(getText());
    }

    /**
         * @return the logger
         */
    private Logger getLogger() {
	return logger;
    }

    /**
         * @param logger
         *                the logger to set
         */
    public void setLogger(Logger logger) {
	this.logger = logger;
    }
}
