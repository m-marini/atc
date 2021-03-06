/*
 * PlaneButtonPane.java
 *
 * $Id: ConditionPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 05/gen/08
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
import java.util.List;

import javax.swing.JButton;
import javax.swing.JPanel;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.Location;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: ConditionPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class ConditionPane extends AbstractCommandPane implements
		UIAtcConstants {
	private static final String IMMEDIATE_LOCATION_ID = "Immediate";

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;
	private JButton immediateBtn;
	private ActionListener listener;

	/**
	 * 
	 */
	public ConditionPane() {
		immediateBtn = new JButton();
		listener = new ActionListener() {

			@Override
			public void actionPerformed(ActionEvent e) {
				String locationId = e.getActionCommand();
				if (IMMEDIATE_LOCATION_ID.equals(locationId))
					locationId = null;
				getCommandController().notifyLocationSelection(locationId);
			}
		};
		setDefaultButtonIcon(createIcon(BUTTON_IMAGE));
		setCancelButtonIcon(createIcon(CANCEL_IMAGE));
		immediateBtn = createDefaultButton(IMMEDIATE_LOCATION_ID);
		immediateBtn.setActionCommand(null);
		immediateBtn.addActionListener(listener);
		init("Condition");
	}

	/**
	 * 
	 */
	public void init() {
		if (atcHandler == null)
			return;
		List<Location> locationList = atcHandler.retrieveMapLocations();
		removeAll();
		GridBagLayout gbl = new GridBagLayout();
		setLayout(gbl);
		GridBagConstraints gbc = new GridBagConstraints();
		gbc.gridx = 0;
		gbc.gridy = 0;
		gbc.gridwidth = 2;
		gbc.anchor = GridBagConstraints.WEST;
		gbc.weightx = 1;
		gbc.insets = new Insets(1, 1, 1, 1);
		JButton btn = getCancelBtn();
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;
		btn = immediateBtn;
		gbl.setConstraints(btn, gbc);
		add(btn);
		int y = ++gbc.gridy;
		int n = 0;
		if (locationList != null) {
			n = locationList.size();
			gbc.gridwidth = 1;
			for (int i = 0; i < n; ++i) {
				if (i == (n + 1) / 2) {
					gbc.gridx = 1;
					gbc.gridy = y;
				}
				Location location = locationList.get(i);
				String id = location.getId();
				btn = createDefaultButton(id);
				btn.setActionCommand(id);
				btn.addActionListener(listener);
				gbl.setConstraints(btn, gbc);
				add(btn);
				++gbc.gridy;
			}
		}
		JPanel cmp = new JPanel();
		cmp.setBackground(Color.BLACK);
		gbc.gridx = 0;
		gbc.gridy = y + (n + 1) / 2;
		gbc.gridwidth = 2;
		gbc.weighty = 1;
		gbl.setConstraints(cmp, gbc);
		add(cmp);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}
}
