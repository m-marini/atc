/*
 * Hits.java
 *
 * $Id: Hits.java,v 1.3 2008/03/01 21:17:53 marco Exp $
 *
 * 10/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Hits.java,v 1.3 2008/03/01 21:17:53 marco Exp $
 * 
 */
public class Hits {
	private static final int MAX_ENTRIES_PER_PROFILE = 2;

	private List<GameRecord> table = new ArrayList<GameRecord>(0);

	private boolean updated;

	/**
	 * 
	 * @return
	 */
	public synchronized HitsMemento createMemento() {
		HitsMemento memento = new HitsMemento();
		memento.setTable(getTable());
		setUpdated(false);
		return memento;
	}

	/**
	 * @return the table
	 */
	public synchronized List<GameRecord> getTable() {
		return table;
	}

	/**
	 * 
	 * @param profile
	 * @return
	 */
	private List<GameRecord> getTableByProfile(List<GameRecord> tab,
			String profile) {
		int begin = -1;
		int end = -1;
		int n = tab.size();
		for (int i = 0; i < n; ++i) {
			GameRecord r = tab.get(i);
			if (profile.equals(r.getProfile())) {
				if (begin < 0)
					begin = i;
				end = i;
			}
		}
		if (begin < 0) {
			return tab.subList(0, 0);
		}
		return tab.subList(begin, end + 1);
	}

	/**
	 * 
	 * @param record
	 */
	public synchronized boolean isBetter(GameRecord record) {
		List<GameRecord> tab = getTableByProfile(getTable(),
				record.getProfile());
		int n = tab.size();
		if (n < MAX_ENTRIES_PER_PROFILE)
			return true;
		return record.compareTo(tab.get(n - 1)) < 0;
	}

	/**
	 * @return the updated
	 */
	public synchronized boolean isUpdated() {
		return updated;
	}

	/**
	 * 
	 * @param record
	 */
	public synchronized void register(GameRecord record) {
		List<GameRecord> tab = new ArrayList<GameRecord>(getTable());
		tab.add(record);
		sort(tab);
		setTable(tab);
		setUpdated(true);
	}

	/**
	 * 
	 * @param memento
	 */
	public synchronized void setMemento(HitsMemento memento) {
		setTable(memento.getTable());
		setUpdated(false);
	}

	/**
	 * @param table
	 *            the table to set
	 */
	private void setTable(List<GameRecord> table) {
		this.table = table;
	}

	/**
	 * @param updated
	 *            the updated to set
	 */
	private void setUpdated(boolean updated) {
		this.updated = updated;
	}

	/**
	 * 
	 * @param table
	 */
	private void sort(List<GameRecord> table) {
		Collections.sort(table);
		String[] profiles = GameRecord.PROFILES;
		int n = profiles.length;
		for (int i = 0; i < n; ++i) {
			List<GameRecord> sub = getTableByProfile(table, profiles[i]);
			int m = sub.size();
			if (m > MAX_ENTRIES_PER_PROFILE) {
				sub.subList(MAX_ENTRIES_PER_PROFILE, m).clear();
			}
		}
	}

}
