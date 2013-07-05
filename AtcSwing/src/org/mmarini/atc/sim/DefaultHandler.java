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
	}

	/**
         * 
         */
	@Override
	public void consume(Message message) {
		getSession().consume(message);
	}

	/**
         * 
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
         * 
         */
	@Override
	public void createSession(String radarMap, String profile) {
		AtcSession session = getSessionFactory().createSession(radarMap,
				profile);
		setSession(session);
	}

	/**
         * 
         */
	@Override
	public int getCollisionCount() {
		return getSession().getCollisionCount();
	}

	/**
         * 
         */
	@Override
	public int getCrashCount() {
		return getSession().getCrashCount();
	}

	/**
	 * @return the hits
	 */
	private Hits getHits() {
		return hits;
	}

	/**
         * 
         */
	@Override
	public int getIterationCount() {
		return getSession().getIterationCount();
	}

	/**
         * 
         */
	@Override
	public double getNewPlaneProbability() {
		return getSession().getNewPlaneProbability();
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
	 * @return
	 */
	private String getRadarMapName() {
		return getSession().getRadarMapName();
	}

	/**
	 * @return the radarPainter
	 */
	private RadarPainter getRadarPainter() {
		return radarPainter;
	}

	/**
         * 
         */
	@Override
	public int getSafeExit() {
		return getSession().getSafeCount();
	}

	/**
	 * @return the session
	 */
	private AtcSession getSession() {
		return session;
	}

	/**
	 * @return the sessionFactory
	 */
	private SessionFactory getSessionFactory() {
		return sessionFactory;
	}

	/**
         * 
         */
	@Override
	public int getWrongExitCount() {
		return getSession().getWrongExitCount();
	}

	/**
         * 
         */
	@Override
	public boolean isBetter() {
		return getHits().isBetter(createRecord());
	}

	/**
         * 
         */

	@Override
	public void paintRadar(Graphics gr, Dimension size) {
		RadarPainter painter = getRadarPainter();
		painter.setSize(size);
		painter.setAtcHandler(this);
		painter.paint(gr);
	}

	/**
         * 
         */
	@Override
	public void register(String recordId) {
		GameRecord record = createRecord();
		record.setName(recordId);
		getHits().register(record);
	}

	/**
         * 
         */
	@Override
	public List<Location> retrieveBeacons() {
		return getSession().getBeaconList();
	}

	/**
         * 
         */
	@Override
	public List<Gateway> retrieveExits() {
		return getSession().getExitList();
	}

	/**
         * 
         */
	@Override
	public Hits retrieveHits() {
		return getHits();
	}

	/**
         * 
         */
	@Override
	public List<Location> retrieveMapLocations() {
		AtcSession session = getSession();
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
		getSession().dequeueMessages(consumer);
	}

	/**
         * 
         */
	@Override
	public List<Plane> retrievePlanes() {
		AtcSession session = getSession();
		if (session == null)
			return null;
		return session.getPlaneList();
	}

	/**
         * 
         */
	@Override
	public List<RadarMap> retrieveRadarMap() {
		return getSessionFactory().getRadarMap();
	}

	/**
         * 
         */
	@Override
	public List<Route> retrieveRoutes() {
		return getSession().getRouteList();
	}

	/**
         * 
         */
	@Override
	public List<Gateway> retrieveRunways() {
		AtcSession session = getSession();
		if (session == null)
			return null;
		return session.getRunwayList();
	}

	/**
	 * @param hits
	 *            the hits to set
	 */
	public void setHits(Hits hits) {
		this.hits = hits;
	}

	/**
	 * @param radarPainter
	 *            the radarPainter to set
	 */
	public void setRadarPainter(RadarPainter radarPainter) {
		this.radarPainter = radarPainter;
	}

	/**
	 * @param session
	 *            the session to set
	 */
	private void setSession(AtcSession session) {
		this.session = session;
	}

	/**
	 * @param sessionFactory
	 *            the sessionFactory to set
	 */
	public void setSessionFactory(SessionFactory sessionFactory) {
		this.sessionFactory = sessionFactory;
	}

	/**
         * 
         */
	@Override
	public void storeHits(HitsMemento memento) {
		getHits().setMemento(memento);
	}

	/**
         * 
         */
	@Override
	public void updateSession() {
		getSession().update();
	}
}
