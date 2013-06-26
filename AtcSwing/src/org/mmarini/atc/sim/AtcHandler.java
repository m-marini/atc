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
import java.util.List;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcHandler.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public interface AtcHandler extends MessageConsumer {
    /**
         * 
         * @param consumer
         */
    public void retrieveMessages(MessageConsumer consumer);

    /**
         * 
         * @return
         */
    public abstract List<Location> retrieveMapLocations();

    /**
         * 
         * @return
         */
    public abstract List<Route> retrieveRoutes();

    /**
         * 
         * @return
         */
    public abstract List<Plane> retrievePlanes();

    /**
         * 
         * 
         */
    public abstract void updateSession();

    /**
         * Retrieve the radar map list
         * 
         * @return the list
         */
    public abstract List<RadarMap> retrieveRadarMap();

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
    public abstract List<Gateway> retrieveRunways();

    /**
         * 
         * @return
         */
    public int getCrashCount();

    /**
         * 
         * @return
         */
    public int getCollisionCount();

    /**
         * 
         * @return
         */
    public int getWrongExitCount();

    /**
         * 
         * @return
         */
    public int getSafeExit();

    /**
         * 
         * @return
         */
    public double getNewPlaneProbability();

    /**
         * 
         * @return
         */
    public int getIterationCount();

    /**
         * 
         * @param gr
         * @param size
         */
    public void paintRadar(Graphics gr, Dimension size);

    /**
         * 
         * @param logger
         */
    public void retrieveMessages(Logger logger);

    /**
         * 
         * @return
         */
    public GameRecord createRecord();

    /**
         * 
         * @return
         */
    public boolean isBetter();

    /**
         * 
         * 
         */
    public void register(String recordId);

    /**
         * 
         * @return
         */
    public Hits retrieveHits();

    /**
         * 
         * @param memento
         */
    public void storeHits(HitsMemento memento);

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
}
