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

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneTablePane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class PlaneTablePane extends JPanel {

	private static Log log = LogFactory.getLog(PlaneTablePane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private PlaneTableModel planeTableModel;

	/**
	 * @return the planeTableModel
	 */
	private PlaneTableModel getPlaneTableModel() {
		return planeTableModel;
	}

	/**
         * 
         * 
         */
	public void init() {
		log.debug("init");
		PlaneTableModel model = getPlaneTableModel();
		JTable table = new JTable(model);
		JScrollPane scrollPane = new JScrollPane(table);
		setLayout(new BorderLayout());
		add(scrollPane, BorderLayout.CENTER);
	}

	/**
	 * @param planeTableModel
	 *            the planeTableModel to set
	 */
	public void setPlaneTableModel(PlaneTableModel planeListModel) {
		this.planeTableModel = planeListModel;
	}
}
