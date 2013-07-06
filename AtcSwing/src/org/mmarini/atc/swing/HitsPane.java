/*
 * HitsPane.java
 *
 * $Id: HitsPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Dimension;

import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;

import org.mmarini.atc.sim.AtcHandler;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HitsPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class HitsPane extends JPanel implements Refreshable {

	/**
	 * 
	 */
	public HitsPane() {
		hitsTableModel = new HitsTableModel();
		init();
	}

	public static final Dimension SIZE = new Dimension(500, 195);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private HitsTableModel hitsTableModel;

	/**
         * 
         * 
         */
	private void init() {
		HitsTableModel model = hitsTableModel;
		JTable table = new JTable(model);
		JScrollPane scrollPane = new JScrollPane(table);
		table.setPreferredScrollableViewportSize(SIZE);
		table.setCellSelectionEnabled(false);
		table.setShowHorizontalLines(false);
		table.setShowVerticalLines(false);
		setLayout(new BorderLayout());
		add(scrollPane, BorderLayout.CENTER);
	}

	/**
	 * @see org.mmarini.atc.swing.Refreshable#refresh()
	 */
	@Override
	public void refresh() {
		hitsTableModel.refresh();
	}

	/**
	 * @param atcHandler
	 * @see org.mmarini.atc.swing.HitsTableModel#setAtcHandler(org.mmarini.atc.sim.AtcHandler)
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		hitsTableModel.setAtcHandler(atcHandler);
	}
}
