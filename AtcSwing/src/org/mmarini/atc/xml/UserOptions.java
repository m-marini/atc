/*
 * UserOptions.java
 *
 * $Id: UserOptions.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.xml;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.xml.XMLConstants;

import org.mmarini.atc.sim.GameRecord;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UserOptions.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class UserOptions implements XmlConstants {

	private List<GameRecord> hits = new ArrayList<GameRecord>(0);

	/**
	 * 
	 * @param record
	 */
	public void addRecord(GameRecord record) {
		getHits().add(record);
	}

	/**
	 * 
	 * @param doc
	 * @return
	 */
	public Element createElement(Document doc) {
		Element elem = doc.createElementNS(ATC_OPTIONS_NS, OPTIONS_ELEM);
		elem.setAttributeNS(XMLConstants.W3C_XML_SCHEMA_INSTANCE_NS_URI,
				SCHEMA_LOCATION_ATTRIBUTE, ATC_OPTIONS_SCHEMA_LOCATION);
		Element el = createHits(doc);
		elem.appendChild(el);
		return elem;
	}

	/**
	 * 
	 * @return
	 */
	private Element createHits(Document doc) {
		Element elem = doc.createElementNS(ATC_OPTIONS_NS, HITS_ELEMENT);
		List<GameRecord> hits = getHits();
		if (hits != null) {
			for (Iterator<GameRecord> i = hits.iterator(); i.hasNext();) {
				Element el = createRecord(doc, i.next());
				elem.appendChild(el);
			}
		}
		return elem;
	}

	/**
	 * 
	 * @param record
	 * @return
	 */
	private Element createRecord(Document doc, GameRecord record) {
		Element elem = doc.createElementNS(ATC_OPTIONS_NS, HITS_RECORD_ELEMENT);
		elem.setAttributeNS(ATC_OPTIONS_NS, HITS_NAME_ATTR, record.getName());
		elem.setAttributeNS(ATC_OPTIONS_NS, HITS_PLANE_COUNT_ATTR,
				String.valueOf(record.getPlaneCount()));
		elem.setAttributeNS(ATC_OPTIONS_NS, HITS_ITERATION_COUNT_ATTR,
				String.valueOf(record.getIterationCount()));
		elem.setAttributeNS(ATC_OPTIONS_NS, HITS_PROFILE_ATTR,
				record.getProfile());
		elem.setAttributeNS(ATC_OPTIONS_NS, HITS_TIME_ATTR,
				String.valueOf(record.getTime()));
		elem.setAttributeNS(ATC_OPTIONS_NS, HITS_MAP_NAME_ATTR,
				record.getMapName());
		return elem;
	}

	/**
	 * @return the hits
	 */
	public List<GameRecord> getHits() {
		return hits;
	}

	/**
	 * @param hits
	 *            the hits to set
	 */
	public void setHits(List<GameRecord> hits) {
		this.hits = hits;
	}
}
