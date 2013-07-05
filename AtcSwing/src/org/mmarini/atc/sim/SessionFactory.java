/*
 * SessionFactory.java
 *
 * $Id: SessionFactory.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: SessionFactory.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class SessionFactory {
	private List<RadarMap> radarMap;
	private Map<String, GameProfile> profileMap;

	/**
	 * 
	 */
	public SessionFactory() {
		profileMap = new HashMap<>();

		createProfile("training", 0.02, 1);
		createProfile("easy", 0.02, 3);
		createProfile("medium", 0.04, 5);
		createProfile("difficult", 0.1, 7);
		createProfile("hard", 0.1, 10);
	}

	/**
	 * 
	 * @param id
	 * @param probability
	 * @param planeCount
	 */
	private void createProfile(String id, double probability, int planeCount) {
		GameProfile profile = new GameProfile();
		profile.setId(id);
		profile.setNewPlaneProbability(probability);
		profile.setMaxPlane(planeCount);
		profileMap.put(id, profile);
	}

	/**
	 * 
	 * @return
	 */
	public AtcSession createSession(String radarMap, String profile) {
		AtcSession session = new AtcSession();
		GameProfile gameProfile = findProfile(profile);
		session.setGameProfile(gameProfile);
		RadarMap map = findMap(radarMap);
		session.setRadarMap(map);
		return session;
	}

	/**
	 * 
	 * @param id
	 * @return
	 */
	private RadarMap findMap(String id) {
		for (RadarMap map : radarMap) {
			if (id.equals(map.getId())) {
				return map;
			}
		}
		return null;
	}

	/**
	 * 
	 * @param profile
	 * @return
	 */
	private GameProfile findProfile(String profile) {
		return profileMap.get(profile);
	}

	/**
	 * @return the radarMap
	 */
	public List<RadarMap> getRadarMap() {
		return radarMap;
	}

	/**
	 * @param radarMap
	 *            the radarMap to set
	 */
	public void setRadarMap(List<RadarMap> radarMap) {
		this.radarMap = radarMap;
	}
}
