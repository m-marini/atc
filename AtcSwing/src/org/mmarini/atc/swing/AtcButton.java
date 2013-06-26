/*
 * AtcButton.java
 *
 * $Id: AtcButton.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.Color;
import java.awt.Insets;

import javax.swing.JButton;
import javax.swing.SwingUtilities;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcButton.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class AtcButton extends JButton {

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    /**
         * 
         */
    public AtcButton() {
	setHorizontalTextPosition(SwingUtilities.RIGHT);
	setBackground(Color.BLACK);
	setForeground(Color.GREEN);
	setBorderPainted(false);
	setMargin(new Insets(1, 1, 1, 1));
    }

}
