/*
 * RadarPane.java
 *
 * $Id: RadarPainter.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.Insets;
import java.awt.Point;
import java.awt.geom.AffineTransform;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.swing.ImageIcon;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.core.io.Resource;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: RadarPainter.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class RadarPainter implements AtcConstants {
	private static final int LEFT = -1;

	private static final int BOTTOM = -1;

	private static final int RIGHT = 1;

	private static final int TOP = 1;

	private static final int CENTER = 0;

	private static final int LOCATION_TEXT_GAP = 5;

	private static Log log = LogFactory.getLog(RadarPainter.class);

	private Insets insets = new Insets(20, 20, 20, 20);

	private AtcHandler atcHandler;

	private Dimension size;

	private Color defaultRouteColor = new Color(0x303030);

	private Color gridColor = new Color(0x101010);

	private Color beaconColor = new Color(0xfc7e04);

	private Color exitColor = new Color(0xea332a);

	private Color runwayColor = new Color(0xeceacc);

	private Color background = Color.BLACK;

	private Dimension radarSize = new Dimension();

	private List<PlanePainter> planePainter;

	private Map<String, Color> routeColorMap;

	private Comparator<Plane> altitudePlaneComparator = new Comparator<Plane>() {

		@Override
		public int compare(Plane plane0, Plane plane1) {
			return plane1.getAltitude() - plane0.getAltitude();
		}
	};

	private Resource checkpointIconName;

	private Resource runwayIconName;

	private Resource exitIconName;

	private ImageIcon exitIcon;

	private ImageIcon checkpointIcon;

	private ImageIcon runwayIcon;

	/**
	 * 
	 * @param pt
	 * @param text
	 * @param alignment
	 * @param gr
	 */
	private void calculateLocation(Point pt, String text, String alignment,
			Graphics gr) {
		int va;
		int ha;
		if (NORTH.equals(alignment)) {
			va = TOP;
			ha = CENTER;
		} else if (NORTH_EAST.equals(alignment)) {
			va = TOP;
			ha = RIGHT;
		} else if (EAST.equals(alignment)) {
			va = CENTER;
			ha = RIGHT;
		} else if (SOUTH_EAST.equals(alignment)) {
			va = BOTTOM;
			ha = RIGHT;
		} else if (SOUTH.equals(alignment)) {
			va = BOTTOM;
			ha = CENTER;
		} else if (SOUTH_WEST.equals(alignment)) {
			va = BOTTOM;
			ha = LEFT;
		} else if (WEST.equals(alignment)) {
			va = CENTER;
			ha = LEFT;
		} else {
			va = TOP;
			ha = LEFT;
		}
		FontMetrics fontMetrics = gr.getFontMetrics();
		int w = fontMetrics.stringWidth(text);
		switch (ha) {
		case LEFT:
			pt.x = -w - LOCATION_TEXT_GAP;
			break;
		case CENTER:
			pt.x = -w / 2;
			break;
		case RIGHT:
			pt.x = LOCATION_TEXT_GAP;
			break;
		}
		int d = fontMetrics.getDescent();
		int a = fontMetrics.getAscent();
		switch (va) {
		case TOP:
			pt.y = -d - LOCATION_TEXT_GAP;
			break;
		case CENTER:
			pt.y = a - (a + d) / 2;
			break;
		case BOTTOM:
			pt.y = a + LOCATION_TEXT_GAP;
			break;
		}
	}

	/**
	 * 
	 * @param point
	 * @param position
	 */
	private void calculatePoint(Point point, Position position) {
		Dimension size = getRadarSize();
		float scale = size.width / AtcConstants.RADAR_DISTANCE_RANGE * 0.5f;
		float x0 = size.width * 0.5f;
		float y0 = size.height * 0.5f;
		point.x = Math.round(x0 + scale * position.getX());
		point.y = Math.round(y0 - scale * position.getY());
	}

	/**
	 * 
	 * @param gr
	 * @return
	 */
	private Graphics2D createGraphics(Graphics gr) {
		int x = 0;
		int y = 0;
		Dimension size = getRadarSize();
		size.setSize(getSize());
		Insets is = getInsets();
		x += is.left;
		y += is.top;
		size.width -= is.left + is.right;
		size.height -= is.top + is.bottom;
		Graphics2D gr2 = (Graphics2D) gr.create();
		gr2.translate(x, y);
		return gr2;
	}

	/**
	 * @param gr
	 * @param point
	 * @param loc
	 */
	private void drawLabel(Graphics2D gr, Location loc) {
		Point pt = new Point();
		String txt = loc.getId();
		calculateLocation(pt, txt, loc.getAlignment(), gr);
		gr.drawString(txt, pt.x, pt.y);
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @return the background
	 */
	public Color getBackground() {
		return background;
	}

	/**
	 * @return the beaconColor
	 */
	public Color getBeaconColor() {
		return beaconColor;
	}

	/**
	 * @return the checkpointIcon
	 */
	private ImageIcon getCheckpointIcon() {
		return checkpointIcon;
	}

	/**
	 * @return the checkpointIconName
	 */
	private Resource getCheckpointIconName() {
		return checkpointIconName;
	}

	/**
	 * 
	 * @param route
	 * @return
	 */
	private Color getColor(Route route) {
		String type = route.getType();
		Color color = getRouteColorMap().get(type);
		if (color != null)
			return color;
		return getDefaultRouteColor();
	}

	/**
	 * @return the defaultRouteColor
	 */
	private Color getDefaultRouteColor() {
		return defaultRouteColor;
	}

	/**
	 * @return the exitColor
	 */
	public Color getExitColor() {
		return exitColor;
	}

	/**
	 * @return the exitIcon
	 */
	private ImageIcon getExitIcon() {
		return exitIcon;
	}

	/**
	 * @return the exitIconName
	 */
	private Resource getExitIconName() {
		return exitIconName;
	}

	/**
	 * @return the gridColor
	 */
	public Color getGridColor() {
		return gridColor;
	}

	/**
	 * @return the insets
	 */
	public Insets getInsets() {
		return insets;
	}

	/**
	 * @return the planePainter
	 */
	private List<PlanePainter> getPlanePainter() {
		return planePainter;
	}

	/**
	 * 
	 * @param plane
	 * @return
	 */
	private PlanePainter getPlanePainter(Plane plane) {
		int alt = plane.getAltitude();
		List<PlanePainter> planePainter = getPlanePainter();
		int idx = Math.min(Math.max((alt - 2000) / 4000, 0),
				planePainter.size() - 1);
		return planePainter.get(idx);
	}

	/**
	 * @return the radarSize
	 */
	private Dimension getRadarSize() {
		return radarSize;
	}

	/**
	 * @return the routeColorMap
	 */
	private Map<String, Color> getRouteColorMap() {
		return routeColorMap;
	}

	/**
	 * @return the runwayColor
	 */
	public Color getRunwayColor() {
		return runwayColor;
	}

	/**
	 * @return the runwayIcon
	 */
	private ImageIcon getRunwayIcon() {
		return runwayIcon;
	}

	/**
	 * @return the runwayIconName
	 */
	private Resource getRunwayIconName() {
		return runwayIconName;
	}

	/**
	 * @return the size
	 */
	private Dimension getSize() {
		return size;
	}

	/**
         * 
         * 
         */
	public void init() {
		try {
			ImageIcon img = new ImageIcon(getCheckpointIconName().getURL());
			setCheckpointIcon(img);
		} catch (IOException e) {
			log.error(e.getMessage(), e);
		}
		try {
			ImageIcon img = new ImageIcon(getExitIconName().getURL());
			setExitIcon(img);
		} catch (IOException e) {
			log.error(e.getMessage(), e);
		}
		try {
			ImageIcon img = new ImageIcon(getRunwayIconName().getURL());
			setRunwayIcon(img);
		} catch (IOException e) {
			log.error(e.getMessage(), e);
		}
	}

	/**
	 * 
	 * @param gr
	 */
	public void paint(Graphics gr) {
		Dimension size = getSize();
		gr.setColor(getBackground());
		gr.fillRect(0, 0, size.width, size.height);
		Graphics2D gr2 = createGraphics(gr);
		paintRectGrid(gr2);
		paintRoutes(gr2);
		paintRunways(gr2);
		paintExits(gr2);
		paintBeacons(gr2);
		paintPlanes(gr2);
	}

	/**
	 * 
	 * @param gr
	 */
	private void paintBeacons(Graphics2D gr) {
		List<Location> locationList = getAtcHandler().retrieveBeacons();
		gr.setColor(getBeaconColor());
		Point point = new Point();
		AffineTransform transform = new AffineTransform();
		for (Iterator<Location> i = locationList.iterator(); i.hasNext();) {
			Location loc = i.next();
			Position p = loc.getPosition();
			calculatePoint(point, p);
			transform.setToTranslation(point.x, point.y);
			paintLocation(gr, loc, transform);
		}
	}

	/**
	 * 
	 * @param gr
	 */
	private void paintExits(Graphics2D gr) {
		gr.setColor(getExitColor());
		List<Gateway> locationList = getAtcHandler().retrieveExits();
		paintGateways(gr, locationList, getExitIcon());
	}

	/**
	 * @param gr
	 * @param loc
	 */
	private void paintGateway(Graphics2D gr, AffineTransform trans,
			Gateway loc, ImageIcon icon) {
		AffineTransform tmp = gr.getTransform();
		AffineTransform t1 = new AffineTransform(tmp);
		t1.concatenate(trans);
		gr.setTransform(t1);
		if (icon == null)
			gr.drawOval(-3, -3, 7, 7);
		else {
			Image img = icon.getImage();
			AffineTransform tr = new AffineTransform();
			tr.rotate(Math.toRadians(loc.getCourse()));
			tr.translate(-icon.getIconWidth() * 0.5,
					-icon.getIconHeight() * 0.5);
			gr.drawImage(img, tr, icon.getImageObserver());
		}
		drawLabel(gr, loc);
		gr.setTransform(tmp);
	}

	/**
	 * @param gr
	 * @param locationList
	 */
	private void paintGateways(Graphics2D gr, List<Gateway> locationList,
			ImageIcon icon) {
		Point point = new Point();
		AffineTransform trans = new AffineTransform();
		for (Iterator<Gateway> i = locationList.iterator(); i.hasNext();) {
			Gateway loc = i.next();
			Position p = loc.getPosition();
			calculatePoint(point, p);
			trans.setToTranslation(point.x, point.y);
			paintGateway(gr, trans, loc, icon);
		}
	}

	/**
	 * @param gr
	 * @param loc
	 * @param trans
	 */
	private void paintLocation(Graphics2D gr, Location loc,
			AffineTransform trans) {
		AffineTransform tmp = gr.getTransform();
		AffineTransform t1 = new AffineTransform(tmp);
		t1.concatenate(trans);
		gr.setTransform(t1);
		ImageIcon img = getCheckpointIcon();
		if (img == null)
			gr.drawOval(-3, -3, 7, 7);

		else
			gr.drawImage(img.getImage(), -img.getIconWidth() / 2,
					-img.getIconHeight() / 2, img.getImageObserver());
		drawLabel(gr, loc);
		gr.setTransform(tmp);
	}

	/**
	 * 
	 * @param gr
	 * @param plane
	 * @param trans
	 */
	private void paintPlane(Graphics2D gr, Plane plane, AffineTransform trans) {
		PlanePainter painter = getPlanePainter(plane);
		painter.paint(gr, plane, trans);
	}

	/**
	 * 
	 * @param gr
	 */
	private void paintPlanes(Graphics2D gr) {
		List<Plane> list1 = getAtcHandler().retrievePlanes();
		List<Plane> list = new ArrayList<Plane>(list1);
		Collections.sort(list, altitudePlaneComparator);
		Point point = new Point();
		AffineTransform trans = new AffineTransform();
		for (Iterator<Plane> i = list.iterator(); i.hasNext();) {
			Plane plane = i.next();
			if (!plane.isHeld()) {
				Position p = plane.getPosition();
				calculatePoint(point, p);
				trans.setToTranslation(point.x, point.y);
				paintPlane(gr, plane, trans);
			}
		}
	}

	/**
	 * 
	 * @param gr
	 */
	private void paintRectGrid(Graphics gr) {
		Dimension size = getRadarSize();
		int sw = size.width;
		int sh = size.height;
		gr.setColor(getGridColor());
		for (int i = 0; i < 21; ++i) {
			int x = i * sw / 20;
			gr.drawLine(x, 0, x, sh);
		}
		for (int i = 0; i < 21; ++i) {
			int y = i * sh / 20;
			gr.drawLine(0, y, sw, y);
		}
	}

	/**
	 * 
	 * @param gr
	 */
	private void paintRoutes(Graphics gr) {
		List<Route> list = getAtcHandler().retrieveRoutes();
		Point p0 = new Point();
		Point p1 = new Point();
		for (Iterator<Route> i = list.iterator(); i.hasNext();) {
			Route route = i.next();
			calculatePoint(p0, route.getLocation0().getPosition());
			calculatePoint(p1, route.getLocation1().getPosition());
			gr.setColor(getColor(route));
			gr.drawLine(p0.x, p0.y, p1.x, p1.y);
		}
	}

	/**
	 * 
	 * @param gr
	 */
	private void paintRunways(Graphics2D gr) {
		gr.setColor(getRunwayColor());
		List<Gateway> locationList = getAtcHandler().retrieveRunways();
		paintGateways(gr, locationList, getRunwayIcon());
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param background
	 *            the background to set
	 */
	public void setBackground(Color background) {
		this.background = background;
	}

	/**
	 * @param beaconColor
	 *            the beaconColor to set
	 */
	public void setBeaconColor(Color beaconColor) {
		this.beaconColor = beaconColor;
	}

	/**
	 * @param checkpointIcon
	 *            the checkpointIcon to set
	 */
	private void setCheckpointIcon(ImageIcon checkpointIcon) {
		this.checkpointIcon = checkpointIcon;
	}

	/**
	 * @param checkpointIconName
	 *            the checkpointIconName to set
	 */
	public void setCheckpointIconName(Resource checkpointImageName) {
		this.checkpointIconName = checkpointImageName;
	}

	/**
	 * @param defaultRouteColor
	 *            the defaultRouteColor to set
	 */
	public void setDefaultRouteColor(Color defaultRouteColor) {
		this.defaultRouteColor = defaultRouteColor;
	}

	/**
	 * @param exitColor
	 *            the exitColor to set
	 */
	public void setExitColor(Color exitColor) {
		this.exitColor = exitColor;
	}

	/**
	 * @param exitIcon
	 *            the exitIcon to set
	 */
	private void setExitIcon(ImageIcon exitIcon) {
		this.exitIcon = exitIcon;
	}

	/**
	 * @param exitIconName
	 *            the exitIconName to set
	 */
	public void setExitIconName(Resource exitIconName) {
		this.exitIconName = exitIconName;
	}

	/**
	 * @param gridColor
	 *            the gridColor to set
	 */
	public void setGridColor(Color gridColor) {
		this.gridColor = gridColor;
	}

	/**
	 * @param insets
	 *            the insets to set
	 */
	public void setInsets(Insets insets) {
		this.insets = insets;
	}

	/**
	 * @param planePainter
	 *            the planePainter to set
	 */
	public void setPlanePainter(List<PlanePainter> planePainter) {
		this.planePainter = planePainter;
	}

	/**
	 * @param routeColorMap
	 *            the routeColorMap to set
	 */
	public void setRouteColorMap(Map<String, Color> routeColorMap) {
		this.routeColorMap = routeColorMap;
	}

	/**
	 * @param runwayColor
	 *            the runwayColor to set
	 */
	public void setRunwayColor(Color runwayColor) {
		this.runwayColor = runwayColor;
	}

	/**
	 * @param runwayIcon
	 *            the runwayIcon to set
	 */
	private void setRunwayIcon(ImageIcon runwayIcon) {
		this.runwayIcon = runwayIcon;
	}

	/**
	 * @param runwayIconName
	 *            the runwayIconName to set
	 */
	public void setRunwayIconName(Resource runwayIconName) {
		this.runwayIconName = runwayIconName;
	}

	/**
	 * @param size
	 *            the size to set
	 */
	public void setSize(Dimension componentSize) {
		this.size = componentSize;
	}
}
