/*
 * RadarPane.java
 *
 * $Id: RadarPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Insets;

import javax.swing.JComponent;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: RadarPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class RadarPane extends JComponent implements Refreshable,
		UIAtcConstants {

	public static final Color BACKGROUND_COLOR = Color.BLACK;

	private static Log log = LogFactory.getLog(RadarPane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private Dimension componentSize = new Dimension();

	private AtcHandler atcHandler;

	/**
	 * 
	 * @param gr
	 * @return
	 */
	private Graphics createGraphics(Graphics gr) {
		int x = 0;
		int y = 0;
		Dimension size = getComponentSize();
		getSize(size);
		Insets is = getInsets();
		if (is != null) {
			x += is.left;
			y += is.top;
			size.width -= is.left + is.right;
			size.height -= is.top + is.bottom;
		}
		if (size.width > size.height) {
			x += (size.width - size.height) / 2;
			size.width = size.height;
		} else if (size.width < size.height) {
			y += (size.height - size.width) / 2;
			size.height = size.width;
		}
		return gr.create(x, y, size.width, size.height);
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @return the componentSize
	 */
	private Dimension getComponentSize() {
		return componentSize;
	}

	/**
         * 
         * 
         */
	public void init() {
		log.debug("init");
		setFont(ATC_FONT);
		setBackground(BACKGROUND_COLOR);
	}

	/**
	 * @see javax.swing.JComponent#paintComponent(java.awt.Graphics)
	 */
	@Override
	protected void paintComponent(Graphics gr) {
		gr.setColor(getBackground());
		Dimension size = getSize();
		gr.fillRect(0, 0, size.width, size.height);
		gr = createGraphics(gr);
		getAtcHandler().paintRadar(gr, getComponentSize());
	}

	/**
         * 
         */
	@Override
	public void refresh() {
		repaint();
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}
}
