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

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: SessionFactory.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public abstract class SessionFactory {
    private ArrayList<RadarMap> radarMap;

    private Map<String, GameProfile> profileMap;

    /**
         * @return
         */
    protected abstract AtcSession createSessionTemplate();

    /**
         * 
         * @return
         */
    public AtcSession createSession(String radarMap, String profile) {
	AtcSession session = createSessionTemplate();
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
	for (Iterator<RadarMap> iter = getRadarMap().iterator(); iter.hasNext();) {
	    RadarMap map = iter.next();
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
	return getProfileMap().get(profile);
    }

    /**
         * @return the radarMap
         */
    public ArrayList<RadarMap> getRadarMap() {
	return radarMap;
    }

    /**
         * @param radarMap
         *                the radarMap to set
         */
    public void setRadarMap(ArrayList<RadarMap> radarMap) {
	this.radarMap = radarMap;
    }

    /**
         * @return the profileMap
         */
    private Map<String, GameProfile> getProfileMap() {
	return profileMap;
    }

    /**
         * @param profileMap
         *                the profileMap to set
         */
    public void setProfileMap(Map<String, GameProfile> profileMap) {
	this.profileMap = profileMap;
    }
}
