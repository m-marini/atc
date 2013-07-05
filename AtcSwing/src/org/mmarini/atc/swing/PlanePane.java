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
import java.util.Iterator;
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
public class PlanePane extends JPanel implements Refreshable, UIAtcConstants {
	private static final String NEW_LINE = System.getProperty("line.separator");

	private static Log log = LogFactory.getLog(PlanePane.class);

	private static final String PLANE_MESSAGE = "ID: {0}-{2}        FL {1}"
			+ NEW_LINE + "      to {3}    Hdg {4}" + NEW_LINE + "       {5}";

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;

	private JTextArea displayArea = new JTextArea();

	/**
	 * 
	 * @param bfr
	 * @param plane
	 */
	private void formatMsg(StringBuffer bfr, Plane plane) {
		bfr.append(MessageFormat.format(
				PLANE_MESSAGE,
				new Object[] { plane.getId(), plane.getFlightLevelId(),
						plane.getClassId(), plane.getDestinationId(),
						plane.getHeading(), plane.getStatus() }));
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @return the displayArea
	 */
	private JTextArea getDisplayArea() {
		return displayArea;
	}

	/**
         * 
         * 
         */
	public void init() {
		log.debug("init");
		JTextArea area = getDisplayArea();
		area.setEditable(false);
		area.setBackground(Color.BLACK);
		area.setForeground(Color.GREEN);
		area.setFont(ATC_FONT);
		area.setDoubleBuffered(true);
		JScrollPane scrollPane = new JScrollPane(area);
		setLayout(new BorderLayout());
		add(scrollPane, BorderLayout.CENTER);
		refresh();
	}

	/**
         * 
         */
	@Override
	public void refresh() {
		StringBuffer bfr = new StringBuffer();
		AtcHandler handler = getAtcHandler();
		if (handler != null) {
			List<Plane> planeList = handler.retrievePlanes();
			if (planeList != null) {
				int i = 0;
				for (Iterator<Plane> iter = planeList.iterator(); iter
						.hasNext(); ++i) {
					if (i > 0) {
						bfr.append(NEW_LINE);
					}
					Plane plane = iter.next();
					formatMsg(bfr, plane);
				}
			}
		}
		getDisplayArea().setText(bfr.toString());
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
