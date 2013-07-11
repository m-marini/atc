/*
 * GameFrame.java
 *
 * $Id: AtcFrame.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.HeadlessException;
import java.awt.Toolkit;

import javax.swing.JFrame;
import javax.swing.WindowConstants;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.EntitySet;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcFrame.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class AtcFrame extends JFrame {

	private static final long serialVersionUID = 1L;

	private static Log log = LogFactory.getLog(AtcFrame.class);

	private RadarPane radarPane;
	private LeftPane leftPane;
	private DefaultCommandController commandPane;

	/**
	 * @throws HeadlessException
	 */
	public AtcFrame() throws HeadlessException {
		leftPane = new LeftPane();
		radarPane = new RadarPane();
		commandPane = new DefaultCommandController();

		createContent();

		radarPane.setMapListener(new MapListener() {

			@Override
			public void entitiesSelected(EntitySet set) {
				commandPane.manageEntitiesSelection(set);
			}
		});
	}

	/**
	 * Initialization method of the frame.
	 * <p>
	 * It creates the content of the frame, locates, sizes and shows the frame.
	 * </p>
	 * 
	 */
	private void createContent() {
		log.debug("init"); //$NON-NLS-1$
		setDefaultCloseOperation(WindowConstants.DO_NOTHING_ON_CLOSE);
		setTitle("Air Trafic Controller");
		setResizable(false);
		setBackground(Color.BLACK);
		Container cp = getContentPane();
		cp.setLayout(new BorderLayout());
		cp.add(radarPane, BorderLayout.CENTER);
		cp.add(leftPane, BorderLayout.WEST);
		cp.add(commandPane, BorderLayout.EAST);
		pack();
		Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
		Dimension size = screen;
		log.debug("size " + size);
		setSize(new Dimension(size));
		setLocation((screen.width - size.width) / 2,
				(screen.height - size.height) / 2);
	}

	/**
	 * 
	 */
	public void init() {
		leftPane.init();
		commandPane.init();
	}

	/**
	 * 
	 */
	public void refresh() {
		leftPane.refresh();
		radarPane.refresh();
		commandPane.refresh();
	}

	/**
	 * 
	 * @param atcHandler
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		leftPane.setAtcHandler(atcHandler);
		radarPane.setAtcHandler(atcHandler);
		commandPane.setAtcHandler(atcHandler);
	}

	/**
	 * 
	 * @param listener
	 */
	public void setGameListener(GameListener listener) {
		commandPane.setGameListener(listener);
	}
}
