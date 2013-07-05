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

	private List<Gateway> runwayList;

	private List<Gateway> exitList;

	private List<Location> locationList;

	private List<Route> routeList;

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
	public List<Gateway> getRunwayList() {
		return runwayList;
	}

	/**
         * 
         * 
         */
	public void init() {
		ArrayList<Gateway> gwList = new ArrayList<Gateway>(getExitList());
		gwList.addAll(getRunwayList());
		gwList.trimToSize();
		setGatewayList(gwList);
		ArrayList<Location> locList = new ArrayList<Location>(gwList);
		locList.addAll(getBeaconList());
		locList.trimToSize();
		setLocationList(locList);
	}

	/**
	 * @param beaconList
	 *            the beaconList to set
	 */
	public void setBeaconList(List<Location> beaconList) {
		this.beaconList = beaconList;
	}

	/**
	 * @param exitList
	 *            the exitList to set
	 */
	public void setExitList(List<Gateway> exitList) {
		this.exitList = exitList;
	}

	/**
	 * @param gatewayList
	 *            the gatewayList to set
	 */
	private void setGatewayList(List<Gateway> gatewayList) {
		this.gatewayList = gatewayList;
	}

	/**
	 * @param id
	 *            the id to set
	 */
	public void setId(String id) {
		this.id = id;
	}

	/**
	 * @param locationList
	 *            the locationList to set
	 */
	private void setLocationList(List<Location> mapLocation) {
		this.locationList = mapLocation;
	}

	/**
	 * @param name
	 *            the name to set
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * @param routeList
	 *            the routeList to set
	 */
	public void setRouteList(List<Route> routeList) {
		this.routeList = routeList;
	}

	/**
	 * @param runwayList
	 *            the runwayList to set
	 */
	public void setRunwayList(List<Gateway> runwayList) {
		this.runwayList = runwayList;
	}
}
