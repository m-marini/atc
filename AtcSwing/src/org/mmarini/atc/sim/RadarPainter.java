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
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.swing.ImageIcon;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: RadarPainter.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class RadarPainter implements AtcConstants {

	private static final String RUNWAY_IMAGE_NAME = "/images/runway.png";
	private static final String ENTRY_IMAGE_NAME = "/images/entry.png";
	private static final String BEACON_IMAGE_NAME = "/images/beacon.png";

	private static final Color H040_COLOR = new Color(0xeceacc);
	private static final Color H080_COLOR = new Color(0x8de5e8);
	private static final Color H120_COLOR = new Color(0x60d750);
	private static final Color H160_COLOR = new Color(0x2b21e9);
	private static final Color H200_COLOR = new Color(0xe95ada);
	private static final Color H240_COLOR = new Color(0xe98b30);
	private static final Color H280_COLOR = new Color(0xea332a);
	private static final Color H320_COLOR = new Color(0xeee450);
	private static final Color H360_COLOR = new Color(0xaead97);

	private static final Color ENTRY_CONNECTION_COLOR = new Color(0x8f551d);
	private static final Color LAND_ROUTE_COLOR = new Color(0x797429);
	private static final Color LAND_CONNECTION_COLOR = new Color(0x004000);
	private static final Color TAKEOFF_COLOR = new Color(0x306060);
	private static final Color CONNECTION_COLOR = new Color(0x36200b);

	private static final Color BACKGROUND_COLOR = Color.BLACK;
	private static final Color RUNWAY_COLOR = H040_COLOR;
	private static final Color EXIT_COLOR = H280_COLOR;
	private static final Color BEACON_COLOR = new Color(0xfc7e04);
	private static final Color GRID_COLOR = new Color(0x101010);
	private static final Color DEFAULT_ROUTE_COLOR = CONNECTION_COLOR;

	private static final int LEFT = -1;
	private static final int BOTTOM = -1;
	private static final int RIGHT = 1;
	private static final int TOP = 1;
	private static final int CENTER = 0;
	private static final int LOCATION_TEXT_GAP = 5;
	private static final Insets INSETS = new Insets(20, 20, 20, 20);
	private static final Dimension RADAR_SIZE = new Dimension();

	private Insets insets;
	private AtcHandler atcHandler;
	private Dimension size;
	private Color defaultRouteColor;
	private Color gridColor;
	private Color beaconColor;
	private Color exitColor;
	private Color runwayColor;
	private Color background;
	private Dimension radarSize;
	private List<PlanePainter> planePainter;
	private Map<String, Color> routeColorMap;
	private Comparator<Plane> altitudePlaneComparator;
	private ImageIcon exitIcon;
	private ImageIcon checkpointIcon;
	private ImageIcon runwayIcon;

	/**
	 * 
	 */
	public RadarPainter() {
		insets = INSETS;
		defaultRouteColor = DEFAULT_ROUTE_COLOR;
		gridColor = GRID_COLOR;
		beaconColor = BEACON_COLOR;
		exitColor = EXIT_COLOR;
		runwayColor = RUNWAY_COLOR;
		background = BACKGROUND_COLOR;
		radarSize = RADAR_SIZE;
		routeColorMap = new HashMap<String, Color>();
		planePainter = new ArrayList<>();

		routeColorMap.put("entry", ENTRY_CONNECTION_COLOR);
		routeColorMap.put("land", LAND_ROUTE_COLOR);
		routeColorMap.put("landConnection", LAND_CONNECTION_COLOR);
		routeColorMap.put("takeoff", TAKEOFF_COLOR);

		altitudePlaneComparator = new Comparator<Plane>() {

			@Override
			public int compare(Plane plane0, Plane plane1) {
				return plane1.getAltitude() - plane0.getAltitude();
			}
		};
		init();
	}

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
		Dimension size = radarSize;
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
		Dimension size = radarSize;
		size.setSize(this.size);
		Insets is = insets;
		x += is.left;
		y += is.top;
		size.width -= is.left + is.right;
		size.height -= is.top + is.bottom;
		Graphics2D gr2 = (Graphics2D) gr.create();
		gr2.translate(x, y);
		return gr2;
	}

	/**
	 * 
	 * @param jetImageName
	 * @param planeImageName
	 * @param color
	 */
	private void createPlanePainter(String jetImageName, String planeImageName,
			Color color) {
		PlanePainter painter = new PlanePainter();
		painter.setColor(color);
		painter.setJetIcon(new ImageIcon(getClass().getResource(jetImageName)));
		painter.setPlaneIcon(new ImageIcon(getClass().getResource(
				planeImageName)));
		planePainter.add(painter);
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
	 * 
	 * @param route
	 * @return
	 */
	private Color getColor(Route route) {
		String type = route.getType();
		Color color = routeColorMap.get(type);
		if (color != null)
			return color;
		return defaultRouteColor;
	}

	/**
	 * 
	 * @param plane
	 * @return
	 */
	private PlanePainter getPlanePainter(Plane plane) {
		int alt = plane.getAltitude();
		int idx = Math.min(Math.max((alt - 2000) / 4000, 0),
				planePainter.size() - 1);
		return planePainter.get(idx);
	}

	/**
         * 
         * 
         */
	private void init() {
		checkpointIcon = new ImageIcon(getClass()
				.getResource(BEACON_IMAGE_NAME));
		exitIcon = new ImageIcon(getClass().getResource(ENTRY_IMAGE_NAME));
		runwayIcon = new ImageIcon(getClass().getResource(RUNWAY_IMAGE_NAME));

		createPlanePainter("/images/jet-040.png", "/images/plane-040.png",
				H040_COLOR);
		createPlanePainter("/images/jet-080.png", "/images/plane-080.png",
				H080_COLOR);
		createPlanePainter("/images/jet-120.png", "/images/plane-120.png",
				H120_COLOR);
		createPlanePainter("/images/jet-160.png", "/images/plane-160.png",
				H160_COLOR);
		createPlanePainter("/images/jet-200.png", "/images/plane-200.png",
				H200_COLOR);
		createPlanePainter("/images/jet-240.png", "/images/plane-240.png",
				H240_COLOR);
		createPlanePainter("/images/jet-280.png", "/images/plane-280.png",
				H280_COLOR);
		createPlanePainter("/images/jet-320.png", "/images/plane-320.png",
				H320_COLOR);
		createPlanePainter("/images/jet-360.png", "/images/plane-360.png",
				H360_COLOR);
	}

	/**
	 * 
	 * @param gr
	 */
	public void paint(Graphics gr) {
		gr.setColor(background);
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
		List<Location> locationList = atcHandler.retrieveBeacons();
		gr.setColor(beaconColor);
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
		gr.setColor(exitColor);
		List<Gateway> locationList = atcHandler.retrieveExits();
		paintGateways(gr, locationList, exitIcon);
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
		ImageIcon img = checkpointIcon;
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
		List<Plane> list1 = atcHandler.retrievePlanes();
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
		Dimension size = radarSize;
		int sw = size.width;
		int sh = size.height;
		gr.setColor(gridColor);
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
		List<Route> list = atcHandler.retrieveRoutes();
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
		gr.setColor(runwayColor);
		List<Gateway> locationList = atcHandler.retrieveRunways();
		paintGateways(gr, locationList, runwayIcon);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param size
	 *            the size to set
	 */
	public void setSize(Dimension size) {
		this.size = size;
	}
}
