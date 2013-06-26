/*
 * CommandPane.java
 *
 * $Id: FlightLevelPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.Color;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.text.DecimalFormat;
import java.util.List;

import javax.swing.AbstractButton;
import javax.swing.Icon;
import javax.swing.JButton;
import javax.swing.JPanel;

import org.mmarini.atc.sim.AtcConstants;
import org.springframework.core.io.Resource;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: FlightLevelPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class FlightLevelPane extends AbstractCommandPane implements
	AtcConstants, ActionListener {

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    private List<Color> buttonColor;

    private List<Resource> buttonResource;

    /**
         * 
         * 
         */
    public void init() {
	super.init("Flight level");

	GridBagLayout gbl = new GridBagLayout();
	setLayout(gbl);
	GridBagConstraints gbc = new GridBagConstraints();
	gbc.gridx = 0;
	gbc.gridy = 0;
	gbc.anchor = GridBagConstraints.WEST;
	gbc.weightx = 1;
	gbc.insets = new Insets(2, 2, 2, 2);

	JButton btn = getCancelBtn();
	gbl.setConstraints(btn, gbc);
	add(btn);
	++gbc.gridy;

	DecimalFormat decimalFormat = new DecimalFormat("000");
	List<Color> btnCol = getButtonColor();
	int j = 0;
	for (int i = EXIT_ALTITUDE; i > 0; i -= FIGHT_LEVEL_GAP) {
	    String flId = decimalFormat.format(i / 100);
	    btn = createButton("FL " + flId);
	    btn.addActionListener(this);
	    btn.setActionCommand(flId);
	    btn.setForeground(btnCol.get(j));
	    Icon icon = createIcon(getButtonResource().get(j));
	    if (icon != null) {
		btn.setIcon(icon);
		btn.setHorizontalTextPosition(AbstractButton.RIGHT);
	    }
	    ++j;
	    gbl.setConstraints(btn, gbc);
	    ++gbc.gridy;
	    add(btn);
	}

	gbc.weighty = 1;
	JPanel cmp = new JPanel();
	cmp.setBackground(Color.BLACK);
	gbl.setConstraints(cmp, gbc);
	gbc.weightx = 1;
	add(cmp);
    }

    /**
         * @see java.awt.event.ActionListener#actionPerformed(java.awt.event.ActionEvent)
         */
    public void actionPerformed(ActionEvent event) {
	String command = event.getActionCommand();
	getCommandController().notifyFlightLevelSelection(command);
    }

    /**
         * @return the buttonColor
         */
    private List<Color> getButtonColor() {
	return buttonColor;
    }

    /**
         * @param buttonColor
         *                the buttonColor to set
         */
    public void setButtonColor(List<Color> buttonColor) {
	this.buttonColor = buttonColor;
    }

    /**
         * @return the buttonResource
         */
    private List<Resource> getButtonResource() {
	return buttonResource;
    }

    /**
         * @param buttonResource
         *                the buttonResource to set
         */
    public void setButtonResource(List<Resource> buttonResource) {
	this.buttonResource = buttonResource;
    }
}
