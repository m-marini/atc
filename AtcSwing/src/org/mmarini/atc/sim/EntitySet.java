/**
 * 
 */
package org.mmarini.atc.sim;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * @author US00852
 * 
 */
public class EntitySet {
	private List<DefaultRunway> runways;
	private List<Location> locations;
	private List<Plane> planes;
	private int runwayDistance;
	private int locationDistance;
	private int planesDistance;

	/**
	 * 
	 */
	public EntitySet() {
		runways = new ArrayList<>();
		locations = new ArrayList<>();
		planes = new ArrayList<>();
	}

	/**
	 * 
	 * @param locations2
	 */
	public void addLocations(List<Location> locations2) {
		locations.addAll(locations2);
	}

	/**
	 * 
	 * @param planes2
	 */
	public void addPlanes(Collection<Plane> planes2) {
		planes.addAll(planes2);
	}

	/**
	 * 
	 * @param runways2
	 */
	public void addRunways(List<DefaultRunway> runways2) {
		runways.addAll(runways2);
	}

	/**
	 * 
	 */
	public void clear() {
		runways.clear();
		locations.clear();
		planes.clear();
	}

	/**
	 * @return the locationDistance
	 */
	public int getLocationDistance() {
		return locationDistance;
	}

	/**
	 * @return the locations
	 */
	public List<Location> getLocations() {
		return locations;
	}

	/**
	 * @return the planes
	 */
	public List<Plane> getPlanes() {
		return planes;
	}

	/**
	 * @return the planesDistance
	 */
	public int getPlanesDistance() {
		return planesDistance;
	}

	/**
	 * @return the runwayDistance
	 */
	public int getRunwayDistance() {
		return runwayDistance;
	}

	/**
	 * @return the runways
	 */
	public List<DefaultRunway> getRunways() {
		return runways;
	}

	/**
	 * @param locationDistance
	 *            the locationDistance to set
	 */
	public void setLocationDistance(int locationDistance) {
		this.locationDistance = locationDistance;
	}

	/**
	 * @param planesDistance
	 *            the planesDistance to set
	 */
	public void setPlanesDistance(int planesDistance) {
		this.planesDistance = planesDistance;
	}

	/**
	 * @param runwayDistance
	 *            the runwayDistance to set
	 */
	public void setRunwayDistance(int runwayDistance) {
		this.runwayDistance = runwayDistance;
	}

}
