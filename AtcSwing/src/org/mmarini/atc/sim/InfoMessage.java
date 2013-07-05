/*
 * InfoMessage.java
 *
 * $Id: InfoMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: InfoMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 */
public class InfoMessage implements Message {
	private String message;

	/**
         * 
         * 
         */
	public InfoMessage() {
	}

	/**
	 * 
	 * @param message
	 */
	public InfoMessage(String message) {
		this.message = message;
	}

	/**
	 * @see org.mmarini.atc.sim.Message#apply(org.mmarini.atc.sim.MessageVisitor)
	 */
	@Override
	public void apply(MessageVisitor visitor) {
		visitor.visit(this);
	}

	/**
	 * @return the message
	 */
	public String getMessage() {
		return message;
	}

	/**
	 * @param message
	 *            the message to set
	 */
	public void setMessage(String message) {
		this.message = message;
	}

}
