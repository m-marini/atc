/*
 * MessageConsumer.java
 *
 * $Id: MessageConsumer.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 30/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: MessageConsumer.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public interface MessageConsumer {
	/**
	 * 
	 * @param message
	 */
	public void consume(Message message);
}
