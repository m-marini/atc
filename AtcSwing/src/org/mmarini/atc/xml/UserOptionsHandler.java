/**
 * 
 */
package org.mmarini.atc.xml;

import org.mmarini.atc.sim.GameRecord;
import org.xml.sax.Attributes;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

/**
 * @author US00852
 * 
 */
public class UserOptionsHandler extends DefaultHandler implements XmlConstants {
	private UserOptions userOptions;
	private Locator locator;

	/**
	 * 
	 */
	public UserOptionsHandler() {
	}

	/**
	 * @see org.xml.sax.helpers.DefaultHandler#startElement(java.lang.String,
	 *      java.lang.String, java.lang.String, org.xml.sax.Attributes)
	 */
	@Override
	public void startElement(String uri, String localName, String qName,
			Attributes attributes) throws SAXException {
		if ("".equals(uri)) {
			switch (localName) {
			case OPTIONS_ELEM:
				userOptions = new UserOptions();
				break;
			case RECORD_ELEM:
				startRecord(attributes);
				break;
			default:
				break;
			}
		}
	}

	/**
	 * 
	 * @param attributes
	 * @throws SAXParseException
	 */
	private void startRecord(Attributes attributes) throws SAXParseException {
		GameRecord record = new GameRecord();
		String name = attributes.getValue(NAME_ATTR);
		String mapName = attributes.getValue(MAP_NAME_ATTR);
		String profile = attributes.getValue(PROFILE_ATTR);

		int iterationCount;
		int planeCount;
		long time;
		try {
			iterationCount = Integer.parseInt(attributes
					.getValue(ITERATION_COUNT_ATTR));
			planeCount = Integer
					.parseInt(attributes.getValue(PLANE_COUNT_ATTR));
			time = Long.parseLong(attributes.getValue(TIME_ATTR));
		} catch (NumberFormatException e) {
			throw new SAXParseException(e.getMessage(), locator, e);
		}

		record.setTime(time);
		record.setProfile(profile);
		record.setPlaneCount(planeCount);
		record.setMapName(mapName);
		record.setIterationCount(iterationCount);
		record.setName(name);
		userOptions.addRecord(record);
	}

	/**
	 * @see org.xml.sax.helpers.DefaultHandler#error(org.xml.sax.SAXParseException)
	 */
	@Override
	public void error(SAXParseException e) throws SAXException {
		throw e;
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
	 * @return the userOptions
	 */
	public UserOptions getUserOptions() {
		return userOptions;
	}

}
