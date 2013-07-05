/*
 * AtcClock.java
 *
 * $Id: AtcClock.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.Iterator;
import java.util.List;

import javax.swing.Timer;

import org.mmarini.atc.sim.AtcHandler;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcClock.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class AtcClock implements ActionListener {
	private AtcHandler atcHandler;

	private Timer timer = new Timer(1000, this);

	private List<Refreshable> refreshableList;

	private GameListener gameListener;

	/**
         * 
         */
	@Override
	public void actionPerformed(ActionEvent e) {
		AtcHandler atcHandler = getAtcHandler();
		atcHandler.updateSession();
		for (Iterator<Refreshable> i = getRefreshableList().iterator(); i
				.hasNext();) {
			i.next().refresh();
		}
		if (atcHandler.getCrashCount() > 0
				|| atcHandler.getCollisionCount() > 0
				|| atcHandler.getWrongExitCount() > 0) {
			GameListener listener = getGameListener();
			if (listener != null) {
				listener.endGame();
			}
		}
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @return the gameListener
	 */
	private GameListener getGameListener() {
		return gameListener;
	}

	/**
	 * @return the refreshableList
	 */
	private List<Refreshable> getRefreshableList() {
		return refreshableList;
	}

	/**
	 * @return the timer
	 */
	private Timer getTimer() {
		return timer;
	}

	/**
         * 
         * 
         */
	public void init() {
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param gameListener
	 *            the gameListener to set
	 */
	public void setGameListener(GameListener gameListener) {
		this.gameListener = gameListener;
	}

	/**
         * 
         * 
         */
	public void setInterval(int interval) {
		getTimer().setDelay(interval);
	}

	/**
	 * @param refreshableList
	 *            the refreshableList to set
	 */
	public void setRefreshableList(List<Refreshable> refreshableList) {
		this.refreshableList = refreshableList;
	}

	/**
         * 
         * 
         */
	public void start() {
		getTimer().start();
	}

	public void stop() {
		getTimer().stop();
	}
}
