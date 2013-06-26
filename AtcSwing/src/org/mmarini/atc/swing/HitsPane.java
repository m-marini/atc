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

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HitsPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class HitsPane extends JPanel implements Refreshable {

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
    public void init() {
	HitsTableModel model = getHitsTableModel();
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
         * @return the hitsTableModel
         */
    private HitsTableModel getHitsTableModel() {
	return hitsTableModel;
    }

    /**
         * @param hitsTableModel
         *                the hitsTableModel to set
         */
    public void setHitsTableModel(HitsTableModel hitsTableModel) {
	this.hitsTableModel = hitsTableModel;
    }

    /**
         * 
         */
    public void refresh() {
	getHitsTableModel().refresh();
    }
}
