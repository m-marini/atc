/*
 * GameFrame.java
 *
 * $Id: GameFrame.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.HeadlessException;
import java.awt.Toolkit;
import java.util.List;

import javax.swing.JFrame;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.DefaultHandler;
import org.mmarini.atc.sim.HitsMemento;
import org.mmarini.atc.xml.UserOptionsPersistenceManager;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: GameFrame.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class GameFrame extends JFrame implements MenuPaneListener, GameListener {
	private static final long serialVersionUID = 1L;
	private static Log log = LogFactory.getLog(GameFrame.class);

	/**
	 * The entry point of the java application
	 * 
	 * @param arg
	 *            argoument (not used)
	 * @throws Throwable
	 *             in case of errors
	 */
	public static void main(String[] arg) throws Throwable {
		log.info("Starting ATC ..."); //$NON-NLS-1$
		GameFrame frame = new GameFrame();
		frame.setVisible(true);
	}

	private AtcFrame atcFrame;
	private MenuPane menuPane;
	private EndGamePane endGamePane;
	private AtcClock atcClock;
	private HelpPane helpPane;
	private LogPane logPane;
	private AtcHandler atcHandler;
	private List<Refreshable> menuListener;
	private UserOptionsPersistenceManager userOptionHandler;

	/**
	 * @throws HeadlessException
	 */
	public GameFrame() throws HeadlessException {
		helpPane = new HelpPane();
		atcHandler = new DefaultHandler();
		atcClock = new AtcClock();
		atcFrame = new AtcFrame();
		logPane = new LogPane();
		endGamePane = new EndGamePane();
		menuPane = new MenuPane();
		userOptionHandler = new UserOptionsPersistenceManager();

		init();
	}

	/**
         * 
         * 
         */
	private void centerWindow() {
		Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
		Dimension size = getSize();
		log.debug("size " + size);
		setSize(new Dimension(size));
		setLocation((screen.width - size.width) / 2,
				(screen.height - size.height) / 2);
	}

	/**
         * 
         */
	@Override
	public void endGame() {
		atcClock.stop();
		endGamePane.showDialog();
		atcFrame.setVisible(false);
		setVisible(true);
	}

	/**
         * 
         */
	@Override
	public void exitGame() {
		System.exit(0);
	}

	/**
         * 
         */
	private void fireRefresh() {
		if (menuListener == null)
			return;
		for (Refreshable r : menuListener) {
			r.refresh();
		}
	}

	/**
	 * Initialization method of the frame.
	 * <p>
	 * It creates the content of the frame, locates, sizes and shows the frame.
	 * </p>
	 * 
	 */
	private void init() {
		log.debug("init"); //$NON-NLS-1$

		HitsMemento memento = userOptionHandler.getHits();
		atcHandler.storeHits(memento);

		atcClock.setAtcHandler(atcHandler);
		atcClock.setGameListener(this);
		atcClock.addRefreshable(atcFrame);
		atcClock.addRefreshable(logPane);

		atcFrame.setAtcHandler(atcHandler);
		atcFrame.setGameListener(this);

		endGamePane.setAtcHandler(atcHandler);

		logPane.setAtcHandler(atcHandler);

		menuPane.setAtcHandler(atcHandler);
		menuPane.setMenuPaneListener(this);

		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setTitle("Air Trafic Controller");
		setResizable(false);

		Container cp = getContentPane();
		cp.setLayout(new BorderLayout());
		cp.add(menuPane, BorderLayout.CENTER);
		pack();
		centerWindow();
	}

	/**
         * 
         */
	@Override
	public void openHelp() {
		helpPane.showDialog();
	}

	/**
         * 
         */
	@Override
	public void startNewGame(String mapId, String profile) {
		log.debug("mapId=" + mapId + ", profile=" + profile);
		atcHandler.createSession(mapId, profile);
		fireRefresh();
		logPane.clear();
		setVisible(false);
		atcFrame.setVisible(true);
		atcClock.start();
	}
}
