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

import javax.swing.Timer;

import org.mmarini.atc.sim.AtcHandler;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcClock.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class AtcClock {

	private AtcHandler atcHandler;
	private Timer timer;
	private GameListener gameListener;

	/**
	 * 
	 */
	public AtcClock() {
		timer = new Timer(1000, new ActionListener() {

			@Override
			public void actionPerformed(ActionEvent e) {
				refresh();
			}
		});
	}

	/**
	 * 
	 */
	private void refresh() {
		atcHandler.updateSession();
		gameListener.tick();
		if (atcHandler.getCrashCount() > 0
				|| atcHandler.getCollisionCount() > 0
				|| atcHandler.getWrongExitCount() > 0) {
			if (gameListener != null) {
				gameListener.endGame();
			}
		}
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
