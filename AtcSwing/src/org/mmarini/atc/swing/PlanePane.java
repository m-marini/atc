/*
 * PlanePane.java
 *
 * $Id: PlanePane.java,v 1.3 2008/03/01 09:50:13 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Color;
import java.text.MessageFormat;
import java.util.List;

import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.Plane;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlanePane.java,v 1.3 2008/03/01 09:50:13 marco Exp $
 */
public class PlanePane extends JPanel implements UIAtcConstants {
	private static final String NEW_LINE = System.getProperty("line.separator");

	private static Log log = LogFactory.getLog(PlanePane.class);

	private static final String PLANE_MESSAGE = "ID: {0}-{2}        FL {1}"
			+ NEW_LINE + "      to {3}    Hdg {4}" + NEW_LINE + "       {5}";

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;

	private JTextArea displayArea;

	/**
	 * 
	 */
	public PlanePane() {
		displayArea = new JTextArea();
		setBackground(Color.BLACK);
		init();
	}

	/**
	 * 
	 * @param bfr
	 * @param plane
	 */
	private void formatMsg(StringBuilder bfr, Plane plane) {
		bfr.append(MessageFormat.format(PLANE_MESSAGE, plane.getId(),
				plane.getFlightLevelId(), plane.getClassId(),
				plane.getDestinationId(), plane.getHeading(), plane.getStatus()));
	}

	/**
         * 
         * 
         */
	private void init() {
		log.debug("init");

		displayArea.setEditable(false);
		displayArea.setBackground(Color.BLACK);
		displayArea.setForeground(Color.GREEN);
		displayArea.setFont(ATC_FONT);
		displayArea.setDoubleBuffered(true);

		JScrollPane scrollPane = new JScrollPane(displayArea);
		setLayout(new BorderLayout());
		add(scrollPane, BorderLayout.CENTER);

		refresh();
	}

	/**
	 * 
	 */
	public void refresh() {
		StringBuilder bfr = new StringBuilder();
		if (atcHandler != null) {
			List<Plane> planeList = atcHandler.retrievePlanes();
			if (planeList != null) {
				int i = 0;
				for (Plane plane : planeList) {
					if (i > 0) {
						bfr.append(NEW_LINE);
					}
					formatMsg(bfr, plane);
				}
			}
		}
		displayArea.setText(bfr.toString());
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param displayArea
	 *            the displayArea to set
	 */
	public void setDisplayArea(JTextArea displayArea) {
		this.displayArea = displayArea;
	}
}
