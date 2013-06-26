package org.mmarini.atc.sim;

import java.awt.Dimension;
import java.awt.Graphics;
import java.util.List;

/*
 * DefaultHandler.java
 *
 * $Id: DefaultHandler.java,v 1.4 2008/03/01 21:17:52 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */

/**
 * @author marco.marini@mmarini.org
 * @version $Id: DefaultHandler.java,v 1.4 2008/03/01 21:17:52 marco Exp $
 * 
 */
public class DefaultHandler implements AtcHandler {
    private SessionFactory sessionFactory;

    private AtcSession session;

    private RadarPainter radarPainter;

    private Hits hits;

    /**
         * 
         */
    public void consume(Message message) {
	getSession().consume(message);
    }

    /**
         * 
         */
    public List<Location> retrieveMapLocations() {
	AtcSession session = getSession();
	if (session == null)
	    return null;
	return session.getMapLocations();
    }

    /**
         * 
         */
    public List<Plane> retrievePlanes() {
	AtcSession session = getSession();
	if (session == null)
	    return null;
	return session.getPlaneList();
    }

    /**
         * 
         */
    public List<Route> retrieveRoutes() {
	return getSession().getRouteList();
    }

    /**
         * 
         */
    public void updateSession() {
	getSession().update();
    }

    /**
         * 
         */
    public void createSession(String radarMap, String profile) {
	AtcSession session = getSessionFactory().createSession(radarMap,
		profile);
	setSession(session);
    }

    /**
         * 
         */
    public List<RadarMap> retrieveRadarMap() {
	return getSessionFactory().getRadarMap();
    }

    /**
         * @return the sessionFactory
         */
    private SessionFactory getSessionFactory() {
	return sessionFactory;
    }

    /**
         * @param sessionFactory
         *                the sessionFactory to set
         */
    public void setSessionFactory(SessionFactory sessionFactory) {
	this.sessionFactory = sessionFactory;
    }

    /**
         * @return the session
         */
    private AtcSession getSession() {
	return session;
    }

    /**
         * @param session
         *                the session to set
         */
    private void setSession(AtcSession session) {
	this.session = session;
    }

    /**
         * 
         */
    public List<Gateway> retrieveRunways() {
	AtcSession session = getSession();
	if (session == null)
	    return null;
	return session.getRunwayList();
    }

    /**
         * 
         */
    public int getCollisionCount() {
	return getSession().getCollisionCount();
    }

    /**
         * 
         */
    public int getCrashCount() {
	return getSession().getCrashCount();
    }

    /**
         * 
         */
    public int getWrongExitCount() {
	return getSession().getWrongExitCount();
    }

    /**
         * 
         */
    public int getIterationCount() {
	return getSession().getIterationCount();
    }

    /**
         * 
         */
    public double getNewPlaneProbability() {
	return getSession().getNewPlaneProbability();
    }

    /**
         * 
         */
    public int getSafeExit() {
	return getSession().getSafeCount();
    }

    /**
         * 
         */

    public void paintRadar(Graphics gr, Dimension size) {
	RadarPainter painter = getRadarPainter();
	painter.setSize(size);
	painter.setAtcHandler(this);
	painter.paint(gr);
    }

    /**
         * @return the radarPainter
         */
    private RadarPainter getRadarPainter() {
	return radarPainter;
    }

    /**
         * @param radarPainter
         *                the radarPainter to set
         */
    public void setRadarPainter(RadarPainter radarPainter) {
	this.radarPainter = radarPainter;
    }

    /**
         * 
         */
    public void retrieveMessages(Logger logger) {
	LogTextMessageFormat msgFormat = new LogTextMessageFormat(logger);
	retrieveMessages(msgFormat);
    }

    /**
         * 
         */
    public void retrieveMessages(MessageConsumer consumer) {
	getSession().dequeueMessages(consumer);
    }

    /**
         * 
         */
    public GameRecord createRecord() {
	GameRecord record = new GameRecord();
	record.setProfile(getProfile());
	record.setMapName(getRadarMapName());
	record.setIterationCount(getIterationCount());
	record.setPlaneCount(getSafeExit());
	return record;
    }

    /**
         * 
         * @return
         */
    private String getRadarMapName() {
	return getSession().getRadarMapName();
    }

    /**
         * 
         * @return
         */
    private String getProfile() {
	return getSession().getProfile();
    }

    /**
         * 
         */
    public boolean isBetter() {
	return getHits().isBetter(createRecord());
    }

    /**
         * 
         */
    public void register(String recordId) {
	GameRecord record = createRecord();
	record.setName(recordId);
	getHits().register(record);
    }

    /**
         * 
         */
    public Hits retrieveHits() {
	return getHits();
    }

    /**
         * @return the hits
         */
    private Hits getHits() {
	return hits;
    }

    /**
         * @param hits
         *                the hits to set
         */
    public void setHits(Hits hits) {
	this.hits = hits;
    }

    /**
         * 
         */
    public void storeHits(HitsMemento memento) {
	getHits().setMemento(memento);
    }

    /**
         * 
         */
    public List<Location> retrieveBeacons() {
	return getSession().getBeaconList();
    }

    /**
         * 
         */
    public List<Gateway> retrieveExits() {
	return getSession().getExitList();
    }
}
