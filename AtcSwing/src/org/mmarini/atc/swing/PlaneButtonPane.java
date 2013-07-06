/*
 * PlaneButtonPane.java
 *
 * $Id: PlaneButtonPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
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
import java.util.ArrayList;
import java.util.List;

import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JPanel;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.Plane;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneButtonPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class PlaneButtonPane extends AbstractCommandPane implements
		Refreshable, ActionListener {
	private static final String BUTTON_IMAGE = "/images/button.png";
	private static final String DISABLED_BUTTON_IMAGE = "/images/disabledButton.png";

	private static Log log = LogFactory.getLog(PlaneButtonPane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private List<JButton> buttonList;
	private AtcHandler atcHandler;
	private int rows;
	private int columns;

	/**
	 * 
	 */
	public PlaneButtonPane() {
		buttonList = new ArrayList<JButton>(26);
		rows = 10;
		columns = 1;

		ImageIcon icon = new ImageIcon(getClass().getResource(BUTTON_IMAGE));
		setDefaultButtonIcon(icon);

		icon = new ImageIcon(getClass().getResource(DISABLED_BUTTON_IMAGE));
		setDisabledDefaultButtonIcon(icon);

		init();
	}

	/**
         * 
         */
	@Override
	public void actionPerformed(ActionEvent event) {
		String planeId = event.getActionCommand();
		log.debug("button=" + planeId);
		getCommandController().notifyPlaneSelection(planeId);
	}

	/**
         * 
         * 
         */
	private void init() {
		super.init("Select plane");
		GridBagConstraints gbc = new GridBagConstraints();
		GridBagLayout gb = new GridBagLayout();
		setLayout(gb);
		List<JButton> list = buttonList;
		gbc.anchor = GridBagConstraints.WEST;
		gbc.fill = GridBagConstraints.NONE;
		gbc.gridwidth = 1;
		gbc.gridheight = 1;
		gbc.insets = new Insets(2, 2, 2, 2);
		gbc.weightx = 1;
		for (int i = 0; i < rows; ++i) {
			gbc.gridy = i;
			for (int j = 0; j < columns; ++j) {
				gbc.gridx = j;
				JButton btn = createDefaultButton("-");
				list.add(btn);
				btn.addActionListener(this);
				gb.setConstraints(btn, gbc);
				add(btn);
			}
		}
		gbc.gridy++;
		gbc.gridx = 0;
		gbc.weighty = 1;
		gbc.gridwidth = 2;
		JComponent cmp = new JPanel();
		cmp.setBackground(Color.BLACK);
		gb.setConstraints(cmp, gbc);
		add(cmp);
		refresh();
	}

	/**
         * 
         * 
         */
	@Override
	public void refresh() {
		if (atcHandler == null)
			return;
		List<Plane> planeList = atcHandler.retrievePlanes();
		if (planeList == null)
			return;
		int n = Math.min(planeList.size(), buttonList.size());
		for (int i = 0; i < n; ++i) {
			JButton btn = buttonList.get(i);
			Plane plane = planeList.get(i);
			String id = plane.getId();
			btn.setActionCommand(id);
			btn.setText(id);
			btn.setEnabled(true);
		}
		for (int i = n; i < buttonList.size(); ++i) {
			JButton btn = buttonList.get(i);
			btn.setText("-");
			btn.setEnabled(false);
		}
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}
}
