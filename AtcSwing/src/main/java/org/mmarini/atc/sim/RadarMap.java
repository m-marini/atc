/*
 * RadarMap.java
 *
 * $Id: RadarMap.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.util.ArrayList;
import java.util.List;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: RadarMap.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class RadarMap {

	private String id;
	private String name;
	private List<Gateway> gatewayList;
	private List<Location> beaconList;
	private List<DefaultRunway> runwayList;
	private List<Gateway> exitList;
	private List<Location> locationList;
	private List<Route> routeList;

	/**
	 * 
	 */
	public RadarMap() {
		gatewayList = new ArrayList<>();
		locationList = new ArrayList<>();
		beaconList = new ArrayList<>();
		runwayList = new ArrayList<>();
		exitList = new ArrayList<>();
		routeList = new ArrayList<>();
	}

	/**
	 * 
	 * @param beacon
	 */
	public void addBeacon(Location beacon) {
		beaconList.add(beacon);
		locationList.add(beacon);
	}

	/**
	 * 
	 * @param exit
	 */
	public void addExit(Gateway exit) {
		exitList.add(exit);
		locationList.add(exit);
		gatewayList.add(exit);
	}

	/**
	 * 
	 * @param route
	 */
	public void addRoute(Route route) {
		routeList.add(route);
	}

	/**
	 * 
	 * @param runway
	 */
	public void addRunway(DefaultRunway runway) {
		runwayList.add(runway);
		locationList.add(runway);
		gatewayList.add(runway);
	}

	/**
	 * @return the beaconList
	 */
	public List<Location> getBeaconList() {
		return beaconList;
	}

	/**
	 * @return the exitList
	 */
	public List<Gateway> getExitList() {
		return exitList;
	}

	/**
	 * @return the gatewayList
	 */
	public List<Gateway> getGatewayList() {
		return gatewayList;
	}

	/**
	 * @return the id
	 */
	public String getId() {
		return id;
	}

	/**
	 * @return the locationList
	 */
	public List<Location> getLocationList() {
		return locationList;
	}

	/**
	 * @return the name
	 */
	public String getName() {
		return name;
	}

	/**
	 * @return the routeList
	 */
	public List<Route> getRouteList() {
		return routeList;
	}

	/**
	 * @return the runwayList
	 */
	public List<DefaultRunway> getRunwayList() {
		return runwayList;
	}

	/**
	 * @param id
	 *            the id to set
	 */
	public void setId(String id) {
		this.id = id;
	}

	/**
	 * @param name
	 *            the name to set
	 */
	public void setName(String name) {
		this.name = name;
	}
}
