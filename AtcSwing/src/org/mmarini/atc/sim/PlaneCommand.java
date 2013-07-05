/*
 * PlaneCommand.java
 *
 * $Id: PlaneCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 07/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 */
public interface PlaneCommand {
	/**
         * 
         * 
         */
	public abstract void apply();

	/**
	 * 
	 * @return
	 */
	public abstract String getStatusMessage();
}
