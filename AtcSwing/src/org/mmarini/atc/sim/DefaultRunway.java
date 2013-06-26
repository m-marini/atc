/*
 * DefaultRunway.java
 *
 * $Id: DefaultRunway.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: DefaultRunway.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class DefaultRunway extends DefaultLocation implements Gateway {

    private static final int HEADING_LAND_RANGE = 5;

    private int course;

    /**
         * 
         */
    public void initPlane(Plane plane) {
	plane.setAltitude(0);
	plane.setHeading(getCourse());
	plane.setPosition(getPosition());
	plane.setRunway(this);
	plane.setHoldingStatus();
    }

    /**
         * 
         */
    public boolean isBusy() {
	return false;
    }

    /**
         * 
         */
    public boolean isCorrectExit(Plane plane) {
	if (plane.getAltitude() != 0)
	    return false;
	int diff = Math.abs(hdgDifference(plane.getHeading()));
	if (diff > HEADING_LAND_RANGE)
	    return false;
	return true;
    }

    /**
         * 
         * @param route
         * @return
         */
    private int hdgDifference(int route) {
	int diff = route - getCourse();
	if (diff > 180)
	    diff -= 360;
	if (diff < -180)
	    diff += 360;
	return diff;
    }

    /**
         * @return the course
         */
    public int getCourse() {
	return course;
    }

    /**
         * @param course
         *                the course to set
         */
    public void setCourse(int course) {
	this.course = course;
    }
}
