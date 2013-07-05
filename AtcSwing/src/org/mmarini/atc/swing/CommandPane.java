/*
 * CommandPane.java
 *
 * $Id: CommandPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
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

import javax.swing.JButton;
import javax.swing.JPanel;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: CommandPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class CommandPane extends AbstractCommandPane implements ActionListener,
		UIAtcConstants {

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	/**
	 * @see java.awt.event.ActionListener#actionPerformed(java.awt.event.ActionEvent)
	 */
	@Override
	public void actionPerformed(ActionEvent event) {
		String command = event.getActionCommand();
		getCommandController().notifyCommandSelection(command);
	}

	/**
         * 
         * 
         */
	public void init() {
		super.init("Command");

		GridBagLayout gbl = new GridBagLayout();
		setLayout(gbl);
		GridBagConstraints gbc = new GridBagConstraints();
		gbc.anchor = GridBagConstraints.WEST;
		gbc.insets = new Insets(2, 2, 2, 2);
		gbc.gridx = 0;
		gbc.gridy = 0;
		gbc.weightx = 1;

		JButton btn;

		btn = getCancelBtn();
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;

		btn = createDefaultButton("Flight level");
		btn.addActionListener(this);
		btn.setActionCommand(FLIGHT_LEVEL_COMMAND);
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;

		btn = createDefaultButton("Turn to");
		btn.addActionListener(this);
		btn.setActionCommand(TURN_COMMAND);
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;

		btn = createDefaultButton("Clear to land");
		btn.addActionListener(this);
		btn.setActionCommand(LAND_COMMAND);
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;

		btn = createDefaultButton("Hold in circle");
		btn.addActionListener(this);
		btn.setActionCommand(HOLD_COMMAND);
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;

		JPanel cmp = new JPanel();
		cmp.setBackground(Color.BLACK);
		gbc.weighty = 1;
		gbl.setConstraints(cmp, gbc);
		add(cmp);
	}

}
