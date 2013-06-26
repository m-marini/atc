/*
 * Route.java
 *
 * $Id: Route.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Route.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class Route {
    private Location location0;

    private Location location1;

    private String type;

    /**
         * @return the location0
         */
    public Location getLocation0() {
	return location0;
    }

    /**
         * @param location0
         *                the location0 to set
         */
    public void setLocation0(Location location0) {
	this.location0 = location0;
    }

    /**
         * @return the location1
         */
    public Location getLocation1() {
	return location1;
    }

    /**
         * @param location1
         *                the location1 to set
         */
    public void setLocation1(Location location1) {
	this.location1 = location1;
    }

    /**
         * @return the type
         */
    public String getType() {
	return type;
    }

    /**
         * @param type
         *                the type to set
         */
    public void setType(String type) {
	this.type = type;
    }
}
