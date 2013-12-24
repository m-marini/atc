/*
 * Command.java
 *
 * $Id: Command.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Command.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public interface Command {
	/**
	 * 
	 * @return
	 */
	public abstract boolean apply();

}
