/*
 * HitsMemento.java
 *
 * $Id: HitsMemento.java,v 1.2 2008/02/27 14:55:48 marco Exp $
 *
 * 17/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.util.List;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HitsMemento.java,v 1.2 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class HitsMemento {
	private List<GameRecord> table;

	/**
	 * @return the table
	 */
	public List<GameRecord> getTable() {
		return table;
	}

	/**
	 * @param table
	 *            the table to set
	 */
	public void setTable(List<GameRecord> table) {
		this.table = table;
	}

}
