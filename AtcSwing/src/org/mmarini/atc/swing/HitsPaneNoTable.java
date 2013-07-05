/*
 * HitsPane.java
 *
 * $Id: HitsPaneNoTable.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.text.MessageFormat;
import java.util.Iterator;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.Hits;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HitsPaneNoTable.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class HitsPaneNoTable extends JPanel implements Refreshable {

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;

	/**
	 * @param text
	 * @param gbc
	 */
	private void addLabel(String text, GridBagConstraints gbc) {
		JLabel label = new JLabel(text);
		// label.setOpaque(false);
		((GridBagLayout) getLayout()).setConstraints(label, gbc);
		add(label);
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
         * 
         * 
         */
	public void init() {
		setBorder(BorderFactory.createTitledBorder("Hits"));
		refresh();
	}

	/**
         * 
         */
	@Override
	public void refresh() {
		removeAll();
		setLayout(new GridBagLayout());
		GridBagConstraints gbc = new GridBagConstraints();
		gbc.gridx = 0;
		gbc.gridy = 0;
		gbc.insets = new Insets(1, 5, 1, 5);
		Hits hits = getAtcHandler().retrieveHits();

		gbc.anchor = GridBagConstraints.CENTER;
		gbc.fill = GridBagConstraints.HORIZONTAL;
		for (Iterator<GameRecord> i = hits.getTable().iterator(); i.hasNext();) {
			GameRecord record = i.next();
			gbc.gridx = 0;
			gbc.anchor = GridBagConstraints.WEST;
			String text = record.getName();
			addLabel(text, gbc);
			++gbc.gridx;

			gbc.anchor = GridBagConstraints.WEST;
			text = record.getProfile();
			addLabel(text, gbc);
			++gbc.gridx;

			gbc.anchor = GridBagConstraints.EAST;
			text = MessageFormat.format("{0}",
					new Object[] { record.getPlaneCount() });
			addLabel(text, gbc);
			++gbc.gridx;

			gbc.anchor = GridBagConstraints.WEST;
			text = MessageFormat.format("{0}",
					new Object[] { record.getDate() });
			addLabel(text, gbc);
			++gbc.gridx;
			++gbc.gridy;
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
