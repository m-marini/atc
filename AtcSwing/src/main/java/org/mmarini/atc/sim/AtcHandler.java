/*
 * AtcHandler.java
 *
 * $Id: AtcHandler.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Point;
import java.util.List;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcHandler.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public interface AtcHandler extends MessageConsumer {
	/**
	 * 
	 * @return
	 */
	public GameRecord createRecord();

	/**
	 * 
	 * @param radarMap
	 * @param profile
	 */
	public void createSession(String radarMap, String profile);

	/**
	 * 
	 * @return
	 */
	public int getCollisionCount();

	/**
	 * 
	 * @return
	 */
	public int getCrashCount();

	/**
	 * 
	 * @return
	 */
	public int getIterationCount();

	/**
	 * 
	 * @return
	 */
	public double getNewPlaneProbability();

	/**
	 * 
	 * @return
	 */
	public int getSafeExit();

	/**
	 * 
	 * @return
	 */
	public int getWrongExitCount();

	/**
	 * 
	 * @return
	 */
	public boolean isBetter();

	/**
	 * 
	 * @param set
	 * @param point
	 * @param size
	 */
	public abstract void locateEntities(EntitySet set, Point point,
			Dimension size);

	/**
	 * 
	 * @param gr
	 * @param size
	 */
	public void paintRadar(Graphics gr, Dimension size);

	/**
         * 
         * 
         */
	public void register(String recordId);

	/**
	 * 
	 * @return
	 */
	public List<Location> retrieveBeacons();

	/**
	 * 
	 * @return
	 */
	public List<Gateway> retrieveExits();

	/**
	 * 
	 * @return
	 */
	public Hits retrieveHits();

	/**
	 * 
	 * @return
	 */
	public abstract List<Location> retrieveMapLocations();

	/**
	 * 
	 * @param logger
	 */
	public void retrieveMessages(Logger logger);

	/**
	 * 
	 * @param consumer
	 */
	public void retrieveMessages(MessageConsumer consumer);

	/**
	 * 
	 * @return
	 */
	public abstract List<Plane> retrievePlanes();

	/**
	 * Retrieve the radar map list
	 * 
	 * @return the list
	 */
	public abstract List<RadarMap> retrieveRadarMap();

	/**
	 * 
	 * @return
	 */
	public abstract List<Route> retrieveRoutes();

	/**
	 * 
	 * @return
	 */
	public abstract List<DefaultRunway> retrieveRunways();

	/**
	 * 
	 * @param memento
	 */
	public void storeHits(HitsMemento memento);

	/**
         * 
         * 
         */
	public abstract void updateSession();
}
