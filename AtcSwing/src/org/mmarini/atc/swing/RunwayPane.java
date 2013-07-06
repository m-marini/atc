/*
 * PlaneButtonPane.java
 *
 * $Id: RunwayPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
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
import org.mmarini.atc.sim.Gateway;
import org.mmarini.atc.sim.Location;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: RunwayPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class RunwayPane extends AbstractCommandPane implements UIAtcConstants,
		Refreshable, ActionListener {

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;

	/**
	 * 
	 */
	public RunwayPane() {
		setDefaultButtonIcon(createIcon(BUTTON_IMAGE));
		setCancelButtonIcon(createIcon(CANCEL_IMAGE));
		init();
	}

	/**
	 * @see org.mmarini.atc.swing.AbstractCommandPane#actionPerformed(java.awt.event
	 *      .ActionEvent)
	 */
	@Override
	public void actionPerformed(ActionEvent event) {
		String locationId = event.getActionCommand();
		getCommandController().notifyLocationSelection(locationId);
	}

	/**
	 * 
	 */
	private void init() {
		super.init("Runway");
		refresh();
	}

	/**
	 * @see org.mmarini.atc.swing.Refreshable#refresh()
	 */
	@Override
	public void refresh() {
		if (atcHandler == null)
			return;
		List<Gateway> locationList = atcHandler.retrieveRunways();
		removeAll();
		GridBagLayout gbl = new GridBagLayout();
		setLayout(gbl);
		GridBagConstraints gbc = new GridBagConstraints();
		gbc.gridx = 0;
		gbc.gridy = 0;
		gbc.gridwidth = 1;
		gbc.anchor = GridBagConstraints.WEST;
		gbc.weightx = 1;
		gbc.insets = new Insets(1, 1, 1, 1);
		JButton btn = getCancelBtn();
		gbl.setConstraints(btn, gbc);
		add(btn);
		++gbc.gridy;
		if (locationList != null) {
			int n = locationList.size();
			for (int i = 0; i < n; ++i) {
				Location location = locationList.get(i);
				String id = location.getId();
				btn = createDefaultButton(id);
				btn.setActionCommand(id);
				btn.addActionListener(this);
				gbl.setConstraints(btn, gbc);
				add(btn);
				++gbc.gridy;
			}
		}
		JPanel cmp = new JPanel();
		cmp.setBackground(Color.BLACK);
		gbc.gridx = 0;
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
