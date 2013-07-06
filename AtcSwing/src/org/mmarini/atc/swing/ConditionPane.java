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
		UIAtcConstants, Refreshable, ActionListener {
	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;

	private JButton immediateBtn;

	/**
	 * 
	 */
	public ConditionPane() {
		immediateBtn = new JButton();
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
		super.init("Condition");
		JButton btn = createDefaultButton("Immediate");
		setImmediateBtn(btn);
		btn.addActionListener(new ActionListener() {

			@Override
			public void actionPerformed(ActionEvent arg0) {
				getCommandController().notifyLocationSelection(null);
			}
		});
		refresh();
	}

	/**
	 * @see org.mmarini.atc.swing.Refreshable#refresh()
	 */
	@Override
	public void refresh() {
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
				btn.addActionListener(this);
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

	/**
	 * @param immediateBtn
	 *            the immediateBtn to set
	 */
	private void setImmediateBtn(JButton immediateBtn) {
		this.immediateBtn = immediateBtn;
	}
}
