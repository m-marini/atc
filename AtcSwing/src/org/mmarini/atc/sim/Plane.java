/*
 * Plane.java
 *
 * $Id: Plane.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Plane.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public interface Plane {
    /**
         * 
         * 
         */
    public abstract void update();

    /**
         * 
         * @param plane1
         * @return
         */
    public abstract boolean collidesWith(Plane plane1);

    /**
         * 
         * @return
         */
    public abstract boolean isExit();

    /**
         * 
         * @return
         */
    public abstract boolean isCorrectExit();

    /**
         * 
         * @return
         */
    public abstract boolean isLanded();

    /**
         * 
         * @return
         */
    public abstract boolean isCrashed();

    /**
         * 
         * @param destination
         */
    public abstract void setDestination(Gateway destination);

    /**
         * 
         * @param altitude
         */
    public abstract void setAltitude(int altitude);

    /**
         * 
         * @param course
         */
    public abstract void setHeading(int course);

    /**
         * 
         * @param position
         */
    public abstract void setPosition(Position position);

    /**
         * 
         * @return
         */
    public abstract int getAltitude();

    /**
         * 
         * @return
         */
    public abstract Position getPosition();

    /**
         * 
         * 
         */
    public abstract void setFlyingStatus();

    /**
         * 
         * 
         */
    public abstract void setHoldingStatus();

    /**
         * 
         * @return
         */
    public abstract int getHeading();

    /**
         * 
         * @return
         */
    public abstract String getId();

    /**
         * 
         * @return
         */
    public abstract int getSpeed();

    /**
         * 
         * @return
         */
    public abstract boolean isHeld();

    /**
         * 
         * @return
         */
    public abstract String getDestinationId();

    /**
         * 
         * @return
         */
    public abstract String getFlightLevelId();

    /**
         * 
         * @param flightLevelId
         */
    public abstract void applyFlightLevel(String flightLevelId);

    /**
         * 
         * @param location
         */
    public abstract void landTo(Gateway location);

    /**
         * 
         * @param location
         */
    public abstract void applyCircle(Location location);

    /**
         * 
         * @param position
         * @return
         */
    public abstract boolean isInRoute(Position position);

    /**
         * 
         * @param location
         * @param condition
         */
    public abstract void applyTurnTo(Location location, Location condition);

    /**
         * 
         * @param entry_altitude
         */
    public abstract void setExpectedAltitude(int entry_altitude);

    /**
         * 
         * @return
         */
    public abstract Gateway getDestination();

    /**
         * 
         * @return
         */
    public abstract String getStatus();

    /**
         * 
         * @param runway
         */
    public abstract void setRunway(Gateway runway);

    /**
     * 
     * @return
     */
    public abstract String getClassId();
}
