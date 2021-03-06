/*
 * HitsBean.java
 *
 * $Id: HitsBean.java,v 1.3 2008/02/27 14:55:53 marco Exp $
 *
 * 10/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.jsf;

import java.sql.SQLException;
import java.util.List;

import javax.naming.NamingException;

import org.mmarini.atc.db.PersistenceManager;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.Hits;
import org.mmarini.atc.sim.HitsMemento;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HitsBean.java,v 1.3 2008/02/27 14:55:53 marco Exp $
 * 
 */
public class HitsBean {

	private AtcHandler atcHandler;

	private boolean init;
	private static Logger log = LoggerFactory.getLogger(HitsBean.class);

	/**
	 * 
	 */
	public HitsBean() {
		init = false;
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @return the table
	 */
	public List<GameRecord> getTable() {
		init();
		Hits hits = getAtcHandler().retrieveHits();
		return hits.getTable();
	}

	/**
         * 
         * 
         */
	private synchronized void init() {
		if (!init) {
			try {
				PersistenceManager pm = new PersistenceManager();
				try {
					HitsMemento memento = new HitsMemento();
					pm.retrieveMemento(memento);
					atcHandler.storeHits(memento);
				} finally {
					pm.close();
				}
			} catch (SQLException | NamingException e) {
				log.error(e.getMessage(), e);
			}
			init = true;
		}
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	public void store() {
		Hits hits = getAtcHandler().retrieveHits();
		if (!hits.isUpdated())
			return;
		HitsMemento memento = hits.createMemento();
		try {
			PersistenceManager pm = new PersistenceManager();
			try {
				pm.updateMemento(memento);
			} finally {
				pm.close();
			}
		} catch (NamingException | SQLException e) {
			log.error(e.getMessage(), e);
		}
	}
}
