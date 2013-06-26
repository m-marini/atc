/*
 * GameFrame.java
 *
 * $Id: AtcFrame.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Toolkit;

import javax.swing.JComponent;
import javax.swing.JFrame;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcFrame.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class AtcFrame extends JFrame {

    private static final long serialVersionUID = 1L;

    private static Log log = LogFactory.getLog(AtcFrame.class);

    private JComponent radarPane;

    private JComponent planePane;

    private JComponent commandPane;

    /**
         * Initialization method of the frame.
         * <p>
         * It creates the content of the frame, locates, sizes and shows the
         * frame.
         * </p>
         * 
         */
    public void init() {
	log.debug("init"); //$NON-NLS-1$
	setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
	setTitle("Air Trafic Controller");
	setResizable(false);
	Container cp = getContentPane();
	cp.setLayout(new BorderLayout());
	cp.add(getRadarPane(), BorderLayout.CENTER);
	cp.add(getPlanePane(), BorderLayout.WEST);
	cp.add(getCommandPane(), BorderLayout.EAST);
	pack();
	Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
	Dimension size = screen;
	log.debug("size " + size);
	setSize(new Dimension(size));
	setLocation((screen.width - size.width) / 2,
		(screen.height - size.height) / 2);
    }

    /**
         * @return the radarPane
         */
    private JComponent getRadarPane() {
	return radarPane;
    }

    /**
         * @param radarPane
         *                the radarPane to set
         */
    public void setRadarPane(JComponent radarPane) {
	this.radarPane = radarPane;
    }

    /**
         * @return the planePane
         */
    private JComponent getPlanePane() {
	return planePane;
    }

    /**
         * @param planePane
         *                the planePane to set
         */
    public void setPlanePane(JComponent planePane) {
	this.planePane = planePane;
    }

    /**
         * @return the commandPane
         */
    public JComponent getCommandPane() {
	return commandPane;
    }

    /**
         * @param commandPane
         *                the commandPane to set
         */
    public void setCommandPane(JComponent commandPane) {
	this.commandPane = commandPane;
    }
}
