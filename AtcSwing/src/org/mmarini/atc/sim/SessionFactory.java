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

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.XMLConstants;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.xml.RouteMapHandler;
import org.xml.sax.SAXException;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: SessionFactory.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class SessionFactory {
	private static final String RADAR_MAP_XSD = "/xsd/radarMap-0.1.0.xsd";
	private static final String[] MAP_NAMES = { "/maps/lrx.xml",
			"/maps/ffm.xml", "/maps/lon.xml", "/maps/lin.xml", "/maps/par.xml" };

	private static Log log = LogFactory.getLog(SessionFactory.class);

	private List<RadarMap> radarMap;
	private Map<String, GameProfile> profileMap;
	private SAXParserFactory factory;
	private RouteMapHandler handler;
	private SAXParser parser;

	/**
	 * 
	 */
	public SessionFactory() {
		profileMap = new HashMap<>();
		radarMap = new ArrayList<>();

		createProfile("training", 0.02, 1);
		createProfile("easy", 0.02, 3);
		createProfile("medium", 0.04, 5);
		createProfile("difficult", 0.1, 7);
		createProfile("hard", 0.1, 10);
		try {
			loadMaps();
		} catch (ParserConfigurationException | SAXException | IOException e) {
			log.error(e.getMessage(), e);
		}
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
	 * 
	 * @param name
	 * @throws IOException
	 * @throws SAXException
	 */
	private void loadMap(String name) throws SAXException, IOException {
		InputStream stream = getClass().getResourceAsStream(name);
		parser.parse(stream, handler);
		stream.close();
		RadarMap map = handler.getRadarMap();
		radarMap.add(map);
	}

	/**
	 * @throws SAXException
	 * @throws ParserConfigurationException
	 * @throws IOExceptions
	 *             *
	 */
	private void loadMaps() throws ParserConfigurationException, SAXException,
			IOException {
		factory = SAXParserFactory.newInstance();
		factory.setNamespaceAware(true);
		SchemaFactory schemaFactory = SchemaFactory
				.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
		URL schemaUrl = getClass().getResource(RADAR_MAP_XSD);
		Schema schema = schemaFactory.newSchema(schemaUrl);
		factory.setSchema(schema);
		parser = factory.newSAXParser();
		handler = new RouteMapHandler();
		for (String mapName : MAP_NAMES) {
			loadMap(mapName);
		}
	}

	/**
	 * @param radarMap
	 *            the radarMap to set
	 */
	public void setRadarMap(List<RadarMap> radarMap) {
		this.radarMap = radarMap;
	}
}
