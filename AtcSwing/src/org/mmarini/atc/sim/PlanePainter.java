/*
 * PlanePainter.java
 *
 * $Id: PlanePainter.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 20/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.awt.Color;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.geom.AffineTransform;
import java.io.IOException;
import java.net.URL;
import java.text.MessageFormat;

import javax.swing.ImageIcon;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.core.io.Resource;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlanePainter.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class PlanePainter {

    private static final int TEXT_Y_GAP = 20;

    private static final Color BACKGROUND_COLOR = Color.BLACK;

    public static final int TEXT_X_GAP = 1;

    private static Log log = LogFactory.getLog(PlanePainter.class);

    private static final String PLANE_MESSAGE1 = "{0} {2}";

    private static final String PLANE_MESSAGE2 = "{1} {3}";

    private Resource jetIconResource;

    private ImageIcon jetIcon;

    private Resource planeIconResource;

    private ImageIcon planeIcon;

    private Color color;

    /**
         * 
         * 
         */
    public void init() {
	try {
	    URL url = getJetIconResource().getURL();
	    setJetIcon(new ImageIcon(url));
	} catch (IOException e) {
	    log.error("Load jet icon", e);
	}
	try {
	    URL url = getPlaneIconResource().getURL();
	    setPlaneIcon(new ImageIcon(url));
	} catch (IOException e) {
	    log.error("Load plane icon", e);
	}
    }

    /**
         * @return the jetIcon
         */
    private ImageIcon getJetIcon() {
	return jetIcon;
    }

    /**
         * @param jetIcon
         *                the jetIcon to set
         */
    private void setJetIcon(ImageIcon jetIcon) {
	this.jetIcon = jetIcon;
    }

    /**
         * @return the jetIconResource
         */
    private Resource getJetIconResource() {
	return jetIconResource;
    }

    /**
         * @param jetIconResource
         *                the jetIconResource to set
         */
    public void setJetIconResource(Resource jetIconResource) {
	this.jetIconResource = jetIconResource;
    }

    /**
         * @return the planeIcon
         */
    private ImageIcon getPlaneIcon() {
	return planeIcon;
    }

    /**
         * @param planeIcon
         *                the planeIcon to set
         */
    private void setPlaneIcon(ImageIcon planeIcon) {
	this.planeIcon = planeIcon;
    }

    /**
         * @return the planeIconResource
         */
    private Resource getPlaneIconResource() {
	return planeIconResource;
    }

    /**
         * @param planeIconResource
         *                the planeIconResource to set
         */
    public void setPlaneIconResource(Resource planeIconResource) {
	this.planeIconResource = planeIconResource;
    }

    /**
         * 
         * @param gr
         * @param text
         * @param x
         * @param y
         */
    private void drawString(Graphics2D gr, String text, int x, int y) {
	FontMetrics fm = gr.getFontMetrics();
	int fh = fm.getHeight();
	int w = fm.stringWidth(text);
	gr.setColor(BACKGROUND_COLOR);
	gr.fillRect(x, y, w + 1, fh);
	gr.setColor(getColor());
	gr.drawString(text, x + 1, y + fh - fm.getDescent());
    }

    /**
         * 
         * @param gr
         * @param plane
         */
    public void paint(Graphics2D gr, Plane plane, AffineTransform trans) {
	AffineTransform tmp = gr.getTransform();
	AffineTransform t1 = new AffineTransform(tmp);
	t1.concatenate(trans);
	gr.setTransform(t1);
	FontMetrics fm = gr.getFontMetrics();
	gr.setColor(getColor());
	int fh = fm.getHeight();

	gr.drawLine(0, 0, 0, -TEXT_Y_GAP - fh);

	Object[] data = new Object[] { plane.getId(), plane.getFlightLevelId(),
		plane.getClassId(), plane.getSpeed() / 10 };
	String txt = MessageFormat.format(PLANE_MESSAGE1, data);
	drawString(gr, txt, TEXT_X_GAP, -fh - TEXT_Y_GAP);

	txt = MessageFormat.format(PLANE_MESSAGE2, data);
	drawString(gr, txt, TEXT_X_GAP, -TEXT_Y_GAP);

	double rot = Math.toRadians(plane.getHeading());
	ImageIcon img;
	if ("J".equals(plane.getClassId())) {
	    img = getJetIcon();
	} else {
	    img = getPlaneIcon();
	}
	AffineTransform trans1 = new AffineTransform();
	trans1.rotate(rot);
	trans1.translate(-img.getIconWidth() * 0.5, -img.getIconHeight() * 0.5);
	gr.drawImage(img.getImage(), trans1, img.getImageObserver());
	gr.setTransform(tmp);
    }

    /**
         * @return the color
         */
    private Color getColor() {
	return color;
    }

    /**
         * @param color
         *                the color to set
         */
    public void setColor(Color color) {
	this.color = color;
    }
}
