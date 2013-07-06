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
import java.util.ArrayList;
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
	private Timer timer;
	private List<Refreshable> refreshableList;
	private GameListener gameListener;

	/**
	 * 
	 */
	public AtcClock() {
		timer = new Timer(1000, this);
		refreshableList = new ArrayList<>();
	}

	/**
         * 
         */
	@Override
	public void actionPerformed(ActionEvent e) {
		atcHandler.updateSession();
		for (Iterator<Refreshable> i = refreshableList.iterator(); i.hasNext();) {
			i.next().refresh();
		}
		if (atcHandler.getCrashCount() > 0
				|| atcHandler.getCollisionCount() > 0
				|| atcHandler.getWrongExitCount() > 0) {
			if (gameListener != null) {
				gameListener.endGame();
			}
		}
	}

	/**
	 * 
	 * @param refreshable
	 */
	public void addRefreshable(Refreshable refreshable) {
		refreshableList.add(refreshable);
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
	protected void setGameListener(GameListener gameListener) {
		this.gameListener = gameListener;
	}

	/**
         * 
         * 
         */
	public void start() {
		timer.start();
	}

	/**
	 * 
	 */
	public void stop() {
		timer.stop();
	}
}
