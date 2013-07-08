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
import java.util.List;

import org.mmarini.atc.sim.GameRecord;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UserOptions.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class UserOptions implements XmlConstants {

	private List<GameRecord> hits;

	/**
	 * 
	 */
	public UserOptions() {
		hits = new ArrayList<GameRecord>(0);
	}

	/**
	 * 
	 * @param record
	 */
	public void addRecord(GameRecord record) {
		getHits().add(record);
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
