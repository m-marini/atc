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
import java.awt.Toolkit;
import java.util.Iterator;
import java.util.List;

import javax.swing.JFrame;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.springframework.context.support.ClassPathXmlApplicationContext;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: GameFrame.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class GameFrame extends JFrame implements MenuPaneListener, GameListener {
    private static final String[] CONTEXT_CONFIGURATION_FILES = new String[] {
	    "/swing-beans.xml", "/atc-handler.xml" }; //$NON-NLS-1$ //$NON-NLS-2$

    private static final long serialVersionUID = 1L;

    private static Log log = LogFactory.getLog(GameFrame.class);

    private AtcFrame atcFrame;

    private MenuPane menuPane;

    private EndGamePane endGamePane;

    private AtcClock atcClock;

    private HelpPane helpPane;

    private LogPane logPane;

    private AtcHandler atcHandler;

    private List<Refreshable> menuListener;

    /**
         * The entry point of the java application
         * 
         * @param arg
         *                argoument (not used)
         * @throws Throwable
         *                 in case of errors
         */
    public static void main(String[] arg) throws Throwable {
	log.info("Starting ATC ..."); //$NON-NLS-1$
	ClassPathXmlApplicationContext ctx = new ClassPathXmlApplicationContext(
		CONTEXT_CONFIGURATION_FILES);
	GameFrame frame = (GameFrame) ctx.getBean(GameFrame.class.getName(),
		GameFrame.class);
	frame.setVisible(true);
    }

    /**
         * Initialization method of the frame.
         * <p>
         * It creates the content of the frame, locates, sizes and shows the
         * frame.
         * </p>
         * 
         */
    public void init() {
	log.debug("init"); //$NON-NLS-1$

	setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
	setTitle("Air Trafic Controller");
	setResizable(false);

	Container cp = getContentPane();
	cp.setLayout(new BorderLayout());
	cp.add(getMenuPane(), BorderLayout.CENTER);
	pack();
	centerWindow();
    }

    /**
         * @return the atcFrame
         */
    private AtcFrame getAtcPane() {
	return atcFrame;
    }

    /**
         * @param atcFrame
         *                the atcFrame to set
         */
    public void setAtcPane(AtcFrame atcFrame) {
	this.atcFrame = atcFrame;
    }

    /**
         * @return the menuPane
         */
    private MenuPane getMenuPane() {
	return menuPane;
    }

    /**
         * @param menuPane
         *                the menuPane to set
         */
    public void setMenuPane(MenuPane menuPane) {
	this.menuPane = menuPane;
    }

    /**
         * 
         */
    public void exitGame() {
	System.exit(0);
    }

    /**
         * 
         */
    public void startNewGame(String mapId, String profile) {
	log.debug("mapId=" + mapId + ", profile=" + profile);
	getAtcHandler().createSession(mapId, profile);
	fireRefresh();
	getLogPane().clear();
	setVisible(false);
	getAtcPane().setVisible(true);
	getAtcClock().start();
    }

    /**
         * 
         */
    private void fireRefresh() {
	List<Refreshable> list = getMenuListener();
	if (list == null)
	    return;
	for (Iterator<Refreshable> i = list.iterator(); i.hasNext();) {
	    i.next().refresh();
	}
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
         * @return the atcClock
         */
    private AtcClock getAtcClock() {
	return atcClock;
    }

    /**
         * @param atcClock
         *                the atcClock to set
         */
    public void setAtcClock(AtcClock atcClock) {
	this.atcClock = atcClock;
    }

    /**
         * @return the atcHandler
         */
    private AtcHandler getAtcHandler() {
	return atcHandler;
    }

    /**
         * @param atcHandler
         *                the atcHandler to set
         */
    public void setAtcHandler(AtcHandler atcHandler) {
	this.atcHandler = atcHandler;
    }

    /**
         * 
         */
    public void endGame() {
	getAtcClock().stop();
	getEndGamePane().showDialog();
	getAtcPane().setVisible(false);
	setVisible(true);
    }

    /**
         * @return the endGamePane
         */
    private EndGamePane getEndGamePane() {
	return endGamePane;
    }

    /**
         * @param endGamePane
         *                the endGamePane to set
         */
    public void setEndGamePane(EndGamePane endGamePane) {
	this.endGamePane = endGamePane;
    }

    /**
         * @return the menuListener
         */
    private List<Refreshable> getMenuListener() {
	return menuListener;
    }

    /**
         * @param menuListener
         *                the menuListener to set
         */
    public void setMenuListener(List<Refreshable> menuListener) {
	this.menuListener = menuListener;
    }

    /**
         * 
         */
    public void openHelp() {
	getHelpPane().showDialog();
    }

    /**
         * @return the helpPane
         */
    private HelpPane getHelpPane() {
	return helpPane;
    }

    /**
         * @param helpPane
         *                the helpPane to set
         */
    public void setHelpPane(HelpPane helpPane) {
	this.helpPane = helpPane;
    }

    /**
         * @return the logPane
         */
    private LogPane getLogPane() {
	return logPane;
    }

    /**
         * @param logPane
         *                the logPane to set
         */
    public void setLogPane(LogPane logPane) {
	this.logPane = logPane;
    }
}
