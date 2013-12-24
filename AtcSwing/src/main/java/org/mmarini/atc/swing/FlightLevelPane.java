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

import javax.swing.Icon;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import org.mmarini.atc.sim.AtcConstants;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: FlightLevelPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class FlightLevelPane extends AbstractCommandPane implements
		UIAtcConstants, AtcConstants, ActionListener {

	private static final Color[] LEVEL_COLORS = new Color[] { H360_COLOR,
			H320_COLOR, H280_COLOR, H240_COLOR, H200_COLOR, H160_COLOR,
			H120_COLOR, H080_COLOR, H040_COLOR };

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	/**
	 * 
	 */
	public FlightLevelPane() {
		setCancelButtonIcon(createIcon(CANCEL_IMAGE));
		init();
	}

	/**
	 * @see java.awt.event.ActionListener#actionPerformed(java.awt.event.ActionEvent)
	 */
	@Override
	public void actionPerformed(ActionEvent event) {
		String command = event.getActionCommand();
		getCommandController().notifyFlightLevelSelection(command);
	}

	/**
         * 
         * 
         */
	private void init() {
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
		int j = 0;
		for (int i = EXIT_ALTITUDE; i > 0; i -= FIGHT_LEVEL_GAP) {
			String flId = decimalFormat.format(i / 100);
			btn = createButton("FL " + flId);
			btn.addActionListener(this);
			btn.setActionCommand(flId);
			btn.setForeground(LEVEL_COLORS[j]);
			Icon icon = createIcon(LEVEL_IMAGES[j]);
			if (icon != null) {
				btn.setIcon(icon);
				btn.setHorizontalTextPosition(SwingConstants.RIGHT);
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
}
