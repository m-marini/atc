/*
 * XmlConstants.java
 *
 * $Id: XmlConstants.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.xml;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: XmlConstants.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public interface XmlConstants {

	public static final String Y_ATTR = "y";
	public static final String X_ATTR = "x";
	public static final String ALIGNMENT_ATTR = "alignment";
	public static final String ID_ATTR = "id";
	public static final String TYPE_ATTR = "type";
	public static final String TO_ATTR = "to";
	public static final String FROM_ATTR = "from";
	public static final String COURSE_ATTR = "course";
	public static final String NAME_ATTR = "name";
	public static final String TIME_ATTR = "time";
	public static final String PROFILE_ATTR = "profile";
	public static final String PLANE_COUNT_ATTR = "planeCount";
	public static final String MAP_NAME_ATTR = "mapName";
	public static final String ITERATION_COUNT_ATTR = "iterationCount";

	public static final String OPTIONS_ELEM = "options";
	public static final String RECORD_ELEM = "record";
	public static final String EXIT_ELEM = "exit";
	public static final String ROUTE_ELEM = "route";
	public static final String RUNWAY_ELEM = "runway";
	public static final String BEACON_ELEM = "beacon";
	public static final String RADAR_MAP_ELEM = "radarMap";
	public static final String NAME_SPACE = "http://www.mmarini.org/radarMap-0.1.0";

	public static final String SCHEMA_VERSION = "0.1.0";

	public static final String ATC_OPTIONS_NS = "http://www.mmairni.org/atc/options-"
			+ SCHEMA_VERSION;

	public static final String OPTIONS_PREFIX = "o:";

	public static final String SCHEMA_LOCATION_ATTRIBUTE = "xsi:schemaLocation";

	public static final String ATC_OPTIONS_SCHEMA_LOCATION = ATC_OPTIONS_NS
			+ " options-" + SCHEMA_VERSION + ".xsd";

	//	public static final String OPTIONS_ELEM = OPTIONS_PREFIX + "options";

	public static final String HITS_ELEMENT = OPTIONS_PREFIX + "hits";

	public static final String HITS_RECORD_ELEMENT = OPTIONS_PREFIX + "record";

	public static final String HITS_TIME_ATTR = OPTIONS_PREFIX + "time";

	public static final String HITS_PROFILE_ATTR = OPTIONS_PREFIX + "profile";

	public static final String HITS_ITERATION_COUNT_ATTR = OPTIONS_PREFIX
			+ "iterationCount";

	public static final String HITS_PLANE_COUNT_ATTR = OPTIONS_PREFIX
			+ "planeCount";

	public static final String HITS_NAME_ATTR = OPTIONS_PREFIX + "name";

	public static final String HITS_MAP_NAME_ATTR = OPTIONS_PREFIX + "mapName";
}
