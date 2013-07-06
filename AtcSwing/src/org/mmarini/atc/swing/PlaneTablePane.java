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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneTablePane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class PlaneTablePane extends JPanel {

	/**
	 * 
	 */
	public PlaneTablePane() {
		planeTableModel = new PlaneTableModel();
		init();
	}

	private static Log log = LogFactory.getLog(PlaneTablePane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;
	private PlaneTableModel planeTableModel;

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
