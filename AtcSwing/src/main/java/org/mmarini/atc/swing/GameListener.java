/*
 * GameListener.java
 *
 * $Id: GameListener.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: GameListener.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public interface GameListener {
	/**
         * 
         * 
         */
	public abstract void endGame();

	/**
	 * 
	 */
	public abstract void tick();

}
