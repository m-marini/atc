/*
 * PlanePane.java
 *
 * $Id: PlaneTablePane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.awt.BorderLayout;

import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;

import org.mmarini.atc.sim.AtcHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneTablePane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class PlaneTablePane extends JPanel {

	private static Logger log = LoggerFactory.getLogger(PlaneTablePane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private PlaneTableModel planeTableModel;

	/**
	 * 
	 */
	public PlaneTablePane() {
		planeTableModel = new PlaneTableModel();
		init();
	}

	/**
         * 
         * 
         */
	private void init() {
		log.debug("init");
		JTable table = new JTable(planeTableModel);
		JScrollPane scrollPane = new JScrollPane(table);
		setLayout(new BorderLayout());
		add(scrollPane, BorderLayout.CENTER);
	}

	/**
	 * 
	 * @param atcHandler
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		planeTableModel.setAtcHandler(atcHandler);
	}
}
