/*
 * DefaultGateway.java
 *
 * $Id: DefaultGateway.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: DefaultGateway.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class DefaultGateway extends DefaultRunway {

    private int busyCount;

    /**
         * @see org.mmarini.atc.sim.DefaultLocation#update()
         */
    @Override
    public void update() {
	super.update();
	int ct = getBusyCount();
	if (ct > 0)
	    setBusyCount(ct - 1);
    }

    /**
         * 
         */
    public void initPlane(Plane plane) {
	plane.setAltitude(ENTRY_ALTITUDE);
	plane.setExpectedAltitude(ENTRY_ALTITUDE);
	plane.setHeading(getCourse());
	plane.setPosition(getPosition());
	plane.setFlyingStatus();
	setBusyCount(BUSY_COUNT);
    }

    /**
         * 
         */
    public boolean isCorrectExit(Plane plane) {
	if (plane.getAltitude() != EXIT_ALTITUDE)
	    return false;
	Position position = plane.getPosition();
	if (!isInRange(position))
	    return false;
	return true;
    }

    /**
         * @return the busyCount
         */
    private int getBusyCount() {
	return busyCount;
    }

    /**
         * @param busyCount
         *                the busyCount to set
         */
    private void setBusyCount(int busyCount) {
	this.busyCount = busyCount;
    }

    /**
         * 
         */
    public boolean isBusy() {
	return getBusyCount() > 0;
    }

}
