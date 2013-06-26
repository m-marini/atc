/*
 * AtcConstants.java
 *
 * $Id: AtcConstants.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcConstants.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public interface AtcConstants {

    public static final String NORTH = "N";

    public static final String NORTH_EAST = "NE";

    public static final String EAST = "E";

    public static final String SOUTH_EAST = "SE";

    public static final String SOUTH = "S";

    public static final String SOUTH_WEST = "SW";

    public static final String WEST = "W";

    public static final String NORTH_WEST = "NW";

    public static final float REAL_SPEED_FACTOR = 140f / 0.25f;

    public static final float CIRCLE_LENGTH = 3f;

    public static final float INRANGE_DISTANCE = 2f;

    public static final float COLLISION_DISTANCE = 4f;

    public static final float RADAR_DISTANCE_RANGE = 101f;

    public static final int FLIGHT_LEVEL_ID_GAP = 100;

    public static final int MAX_ALTITUDE = 36000;

    public static final int EXIT_ALTITUDE = 36000;

    public static final int ENTRY_ALTITUDE = 28000;

    public static final int LAND_ALTITUDE = 4000;

    public static final int MAX_LAND_ALTITUDE = LAND_ALTITUDE
	    + FLIGHT_LEVEL_ID_GAP - 1;

    public static final int COLLISION_ALTITUDE_RANGE = 1000;

    public static final int FIGHT_LEVEL_GAP = 4000;

    public static final int BUSY_COUNT = 64;

}
