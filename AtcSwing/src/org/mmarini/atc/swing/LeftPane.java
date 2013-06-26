/*
 * PlanePane.java
 *
 * $Id: LeftPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 04/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Dimension;

import javax.swing.JComponent;
import javax.swing.JPanel;
import javax.swing.JScrollPane;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: LeftPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class LeftPane extends JPanel {

    private static Log log = LogFactory.getLog(LeftPane.class);

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    private JComponent planePane;

    private JComponent logPane;

    /**
         * 
         * 
         */
    public void init() {
	log.debug("init");
	setPreferredSize(new Dimension(200, 10));
	setLayout(new BorderLayout());
	add(getPlanePane(), BorderLayout.CENTER);
	JComponent logPane = getLogPane();
	JScrollPane scrollPane1 = new JScrollPane(logPane);
	add(scrollPane1, BorderLayout.SOUTH);
    }

    /**
         * @return the logPane
         */
    private JComponent getLogPane() {
	return logPane;
    }

    /**
         * @param logPane
         *                the logPane to set
         */
    public void setLogPane(JComponent logPane) {
	this.logPane = logPane;
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
}
