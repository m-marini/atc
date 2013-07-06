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
	public DefaultHandler() {
		hits = new Hits();
		radarPainter = new RadarPainter();
		sessionFactory = new SessionFactory();
	}

	/**
	 * @see org.mmarini.atc.sim.MessageConsumer#consume(org.mmarini.atc.sim.Message)
	 */
	@Override
	public void consume(Message message) {
		session.consume(message);
	}

	/**
	 * @see org.mmarini.atc.sim.AtcHandler#createRecord()
	 */
	@Override
	public GameRecord createRecord() {
		GameRecord record = new GameRecord();
		record.setProfile(getProfile());
		record.setMapName(getRadarMapName());
		record.setIterationCount(getIterationCount());
		record.setPlaneCount(getSafeExit());
		return record;
	}

	/**
	 * @see org.mmarini.atc.sim.AtcHandler#createSession(java.lang.String,
	 *      java.lang.String)
	 */
	@Override
	public void createSession(String radarMap, String profile) {
		session = sessionFactory.createSession(radarMap, profile);
	}

	/**
	 * @see org.mmarini.atc.sim.AtcHandler#getCollisionCount()
	 */
	@Override
	public int getCollisionCount() {
		return session.getCollisionCount();
	}

	/**
	 * @see org.mmarini.atc.sim.AtcHandler#getCrashCount()
	 */
	@Override
	public int getCrashCount() {
		return session.getCrashCount();
	}

	/**
         * 
         */
	@Override
	public int getIterationCount() {
		return session.getIterationCount();
	}

	/**
         * 
         */
	@Override
	public double getNewPlaneProbability() {
		return session.getNewPlaneProbability();
	}

	/**
	 * 
	 * @return
	 */
	private String getProfile() {
		return session.getProfile();
	}

	/**
	 * 
	 * @return
	 */
	private String getRadarMapName() {
		return session.getRadarMapName();
	}

	/**
         * 
         */
	@Override
	public int getSafeExit() {
		return session.getSafeCount();
	}

	/**
         * 
         */
	@Override
	public int getWrongExitCount() {
		return session.getWrongExitCount();
	}

	/**
         * 
         */
	@Override
	public boolean isBetter() {
		return hits.isBetter(createRecord());
	}

	/**
         * 
         */

	@Override
	public void paintRadar(Graphics gr, Dimension size) {
		radarPainter.setSize(size);
		radarPainter.setAtcHandler(this);
		radarPainter.paint(gr);
	}

	/**
         * 
         */
	@Override
	public void register(String recordId) {
		GameRecord record = createRecord();
		record.setName(recordId);
		hits.register(record);
	}

	/**
         * 
         */
	@Override
	public List<Location> retrieveBeacons() {
		return session.getBeaconList();
	}

	/**
         * 
         */
	@Override
	public List<Gateway> retrieveExits() {
		return session.getExitList();
	}

	/**
         * 
         */
	@Override
	public Hits retrieveHits() {
		return hits;
	}

	/**
         * 
         */
	@Override
	public List<Location> retrieveMapLocations() {
		if (session == null)
			return null;
		return session.getMapLocations();
	}

	/**
         * 
         */
	@Override
	public void retrieveMessages(Logger logger) {
		LogTextMessageFormat msgFormat = new LogTextMessageFormat(logger);
		retrieveMessages(msgFormat);
	}

	/**
         * 
         */
	@Override
	public void retrieveMessages(MessageConsumer consumer) {
		session.dequeueMessages(consumer);
	}

	/**
         * 
         */
	@Override
	public List<Plane> retrievePlanes() {
		if (session == null)
			return null;
		return session.getPlaneList();
	}

	/**
         * 
         */
	@Override
	public List<RadarMap> retrieveRadarMap() {
		return sessionFactory.getRadarMap();
	}

	/**
         * 
         */
	@Override
	public List<Route> retrieveRoutes() {
		return session.getRouteList();
	}

	/**
         * 
         */
	@Override
	public List<Gateway> retrieveRunways() {
		if (session == null)
			return null;
		return session.getRunwayList();
	}

	/**
	 * @see org.mmarini.atc.sim.AtcHandler#storeHits(org.mmarini.atc.sim.HitsMemento)
	 */
	@Override
	public void storeHits(HitsMemento memento) {
		hits.setMemento(memento);
	}

	/**
	 * @see org.mmarini.atc.sim.AtcHandler#updateSession()
	 */
	@Override
	public void updateSession() {
		session.update();
	}
}
