/*
 * PlanePane.java
 *
 * $Id: LeftPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;

import javax.swing.JPanel;
import javax.swing.JScrollPane;

import org.mmarini.atc.sim.AtcHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: LeftPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class LeftPane extends JPanel {

	private static Logger log = LoggerFactory.getLogger(LeftPane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private PlanePane planePane;
	private LogPane logPane;

	/**
	 * 
	 */
	public LeftPane() {
		planePane = new PlanePane();
		logPane = new LogPane();
		createContent();
	}

	/**
         * 
         * 
         */
	private void createContent() {
		log.debug("init");
		setPreferredSize(new Dimension(200, 10));
		setLayout(new BorderLayout());
		setBackground(Color.BLACK);
		add(planePane, BorderLayout.CENTER);
		JScrollPane scrollPane1 = new JScrollPane(logPane);
		add(scrollPane1, BorderLayout.SOUTH);
	}

	/**
	 * 
	 */
	public void init() {
		logPane.clear();
	}

	/**
	 * 
	 */
	public void refresh() {
		planePane.refresh();
		logPane.refresh();
	}

	/**
	 * 
	 * @param atcHandler
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		planePane.setAtcHandler(atcHandler);
		logPane.setAtcHandler(atcHandler);
	}
}
