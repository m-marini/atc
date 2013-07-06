/**
 * 
 */
package org.mmarini.atc.xml;

import java.util.HashMap;
import java.util.Map;

import org.mmarini.atc.sim.DefaultGateway;
import org.mmarini.atc.sim.DefaultLocation;
import org.mmarini.atc.sim.DefaultRunway;
import org.mmarini.atc.sim.Location;
import org.mmarini.atc.sim.Position;
import org.mmarini.atc.sim.RadarMap;
import org.mmarini.atc.sim.Route;
import org.xml.sax.Attributes;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

/**
 * @author US00852
 * 
 */
public class RouteMapHandler extends DefaultHandler implements XmlConstants {
	private Locator locator;
	private RadarMap radarMap;
	private Map<String, Location> locations;

	/**
	 * 
	 */
	public RouteMapHandler() {
		locations = new HashMap<String, Location>();
	}

	/**
	 * 
	 * @param gtw
	 */
	private void addLocation(Location gtw) {
		locations.put(gtw.getId(), gtw);
	}

	/**
	 * @see org.xml.sax.helpers.DefaultHandler#error(org.xml.sax.SAXParseException)
	 */
	@Override
	public void error(SAXParseException e) throws SAXException {
		throw e;
	}

	/**
	 * 
	 * @param loc
	 * @param attributes
	 */
	private void evaluateLocation(DefaultLocation loc, Attributes attributes) {
		String id = attributes.getValue(ID_ATTR);
		String algn = attributes.getValue(ALIGNMENT_ATTR);
		float x = Float.parseFloat(attributes.getValue(X_ATTR));
		float y = Float.parseFloat(attributes.getValue(Y_ATTR));

		loc.setId(id);
		loc.setAlignment(algn);
		Position position = new Position(x, y);
		loc.setPosition(position);
	}

	/**
	 * 
	 * @param name
	 * @return
	 * @throws SAXParseException
	 */
	private Location findLocation(String name) throws SAXParseException {
		Location loc = locations.get(name);
		if (loc == null)
			throw new SAXParseException("Location \"" + name + "\" not found",
					locator);
		return loc;
	}

	/**
	 * @return the radarMap
	 */
	public RadarMap getRadarMap() {
		return radarMap;
	}

	/**
	 * @see org.xml.sax.helpers.DefaultHandler#setDocumentLocator(org.xml.sax.Locator
	 *      )
	 */
	@Override
	public void setDocumentLocator(Locator locator) {
		this.locator = locator;
	}

	/**
	 * 
	 * @param attributes
	 */
	private void startBeacon(Attributes attributes) {
		DefaultGateway beacon = new DefaultGateway();
		evaluateLocation(beacon, attributes);
		radarMap.addBeacon(beacon);
		addLocation(beacon);
	}

	/**
	 * @see org.xml.sax.helpers.DefaultHandler#startDocument()
	 */
	@Override
	public void startDocument() throws SAXException {
		locations.clear();
	}

	/**
	 * @see org.xml.sax.helpers.DefaultHandler#startElement(java.lang.String,
	 *      java.lang.String, java.lang.String, org.xml.sax.Attributes)
	 */
	@Override
	public void startElement(String uri, String localName, String qName,
			Attributes attributes) throws SAXException {
		if (NAME_SPACE.equals(uri)) {
			switch (localName) {
			case RADAR_MAP_ELEM:
				startRadarMap(attributes);
				break;
			case BEACON_ELEM:
				startBeacon(attributes);
				break;
			case RUNWAY_ELEM:
				startRunway(attributes);
				break;
			case EXIT_ELEM:
				startExit(attributes);
				break;
			case ROUTE_ELEM:
				startRoute(attributes);
				break;
			}
		}
	}

	/**
	 * 
	 * @param attributes
	 */
	private void startExit(Attributes attributes) {
		DefaultGateway gtw = new DefaultGateway();
		evaluateLocation(gtw, attributes);
		int course = Integer.parseInt(attributes.getValue(COURSE_ATTR));
		gtw.setCourse(course);
		radarMap.addExit(gtw);
		addLocation(gtw);
	}

	/**
	 * 
	 * @param attributes
	 */
	private void startRadarMap(Attributes attributes) {
		String id = attributes.getValue(ID_ATTR);
		String name = attributes.getValue(NAME_ATTR);
		radarMap = new RadarMap();
		radarMap.setId(id);
		radarMap.setName(name);
		locations.clear();
	}

	/**
	 * 
	 * @param attributes
	 * @throws SAXParseException
	 */
	private void startRoute(Attributes attributes) throws SAXParseException {
		String from = attributes.getValue(FROM_ATTR);
		String to = attributes.getValue(TO_ATTR);
		String type = attributes.getValue(TYPE_ATTR);
		Location fromLoc = findLocation(from);
		Location toLoc = findLocation(to);

		Route route = new Route();
		route.setLocation0(fromLoc);
		route.setLocation1(toLoc);
		if (type != null)
			route.setType(type);
		radarMap.addRoute(route);
	}

	/**
	 * 
	 * @param attributes
	 */
	private void startRunway(Attributes attributes) {
		DefaultRunway runway = new DefaultRunway();
		evaluateLocation(runway, attributes);
		int course = Integer.parseInt(attributes.getValue(COURSE_ATTR));
		runway.setCourse(course);
		radarMap.addRunway(runway);
		addLocation(runway);
	}

}
