/*
 * PlaneButtonPane.java
 *
 * $Id: LocationPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
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
 * @version $Id: LocationPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class LocationPane extends AbstractCommandPane implements UIAtcConstants {
	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;
	private ActionListener listener;

	/**
	 * 
	 */
	public LocationPane() {
		listener = new ActionListener() {

			@Override
			public void actionPerformed(ActionEvent e) {
				String locationId = e.getActionCommand();
				getCommandController().notifyLocationSelection(locationId);
			}
		};
		setDefaultButtonIcon(createIcon(BUTTON_IMAGE));
		setCancelButtonIcon(createIcon(CANCEL_IMAGE));
		init("Location");
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
		int n = 0;
		int nr = 0;
		if (locationList != null) {
			n = locationList.size();
			nr = (n + 1) / 2;
			gbc.gridwidth = 1;
			for (int i = 0; i < n; ++i) {
				gbc.gridx = i / nr;
				gbc.gridy = i % nr + 1;
				Location location = locationList.get(i);
				String id = location.getId();
				btn = createDefaultButton(id);
				btn.setActionCommand(id);
				btn.addActionListener(listener);
				btn.setEnabled(true);
				gbl.setConstraints(btn, gbc);
				add(btn);
			}
		}
		JPanel cmp = new JPanel();
		cmp.setBackground(Color.BLACK);
		gbc.gridx = 0;
		gbc.gridy = nr + 1;
		gbc.gridwidth = 2;
		gbc.weighty = 1;
		gbl.setConstraints(cmp, gbc);
		add(cmp);
		repaint();
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}
}
