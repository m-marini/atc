/*
 * CircleCommand.java
 *
 * $Id: CircleCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 07/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: CircleCommand.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class CircleCommand extends AbstractPlaneCommand {
    /**
         * 
         * @param plane
         */
    public CircleCommand(DefaultPlane plane) {
	super(plane);
    }

    /**
         * @see org.mmarini.atc.sim.PlaneCommand#apply()
         */
    public void apply() {
	getPlane().circle();
    }

    /**
         * 
         */
    public String getStatusMessage() {
	return "circle at {0}";
    }

}
