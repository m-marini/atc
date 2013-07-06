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
import java.awt.Container;
import java.awt.Dimension;
import java.awt.HeadlessException;
import java.awt.Toolkit;

import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.WindowConstants;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcFrame.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class AtcFrame extends JFrame implements Refreshable {

	private static final long serialVersionUID = 1L;

	private static Log log = LogFactory.getLog(AtcFrame.class);

	private RadarPane radarPane;
	private LeftPane planePane;
	private DefaultCommandController commandPane;

	/**
	 * @throws HeadlessException
	 */
	public AtcFrame() throws HeadlessException {
		planePane = new LeftPane();
		radarPane = new RadarPane();
		commandPane = new DefaultCommandController();
		init();
	}

	/**
	 * @return the commandPane
	 */
	public JComponent getCommandPane() {
		return commandPane;
	}

	/**
	 * Initialization method of the frame.
	 * <p>
	 * It creates the content of the frame, locates, sizes and shows the frame.
	 * </p>
	 * 
	 */
	public void init() {
		log.debug("init"); //$NON-NLS-1$
		setDefaultCloseOperation(WindowConstants.DO_NOTHING_ON_CLOSE);
		setTitle("Air Trafic Controller");
		setResizable(false);
		Container cp = getContentPane();
		cp.setLayout(new BorderLayout());
		cp.add(radarPane, BorderLayout.CENTER);
		cp.add(planePane, BorderLayout.WEST);
		cp.add(getCommandPane(), BorderLayout.EAST);
		pack();
		Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
		Dimension size = screen;
		log.debug("size " + size);
		setSize(new Dimension(size));
		setLocation((screen.width - size.width) / 2,
				(screen.height - size.height) / 2);
	}

	/**
	 * @see org.mmarini.atc.swing.Refreshable#refresh()
	 */
	@Override
	public void refresh() {
		planePane.refresh();
		radarPane.refresh();
		commandPane.refresh();
	}

	/**
	 * 
	 * @param atcHandler
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		planePane.setAtcHandler(atcHandler);
		radarPane.setAtcHandler(atcHandler);
		commandPane.setAtcHandler(atcHandler);
	}
}
