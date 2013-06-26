/*
 * PlaneTableModel.java
 *
 * $Id: HitsTableModel.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 05/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.swing.table.AbstractTableModel;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.GameRecord;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HitsTableModel.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 */
public class HitsTableModel extends AbstractTableModel implements Refreshable {

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    private List<GameRecord> records = new ArrayList<GameRecord>(0);

    private AtcHandler atcHandler;

    /**
         * 
         * 
         */
    public void refresh() {
	List<GameRecord> list = getAtcHandler().retrieveHits().getTable();
	List<GameRecord> data = getRecords();
	data.clear();
	data.addAll(list);
	fireTableDataChanged();
    }

    /**
         * @see javax.swing.table.AbstractTableModel#getColumnClass(int)
         */
    @Override
    public Class<?> getColumnClass(int columnIndex) {
	switch (columnIndex) {
	case 2:
	    return Integer.class;
	case 3:
	    return Date.class;
	}
	return String.class;
    }

    /**
         * @see javax.swing.table.AbstractTableModel#getColumnName(int)
         */
    @Override
    public String getColumnName(int column) {
	switch (column) {
	case 0:
	    return "Name";
	case 1:
	    return "Level";
	case 2:
	    return "# Safe Plane";
	case 3:
	    return "Date";
	case 4:
	    return "Map";
	}
	return "?";
    }

    /**
         * 
         */
    public int getColumnCount() {
	return 5;
    }

    /**
         * 
         */
    public int getRowCount() {
	return getRecords().size();
    }

    /**
         * 
         */
    public Object getValueAt(int rowIndex, int columnIndex) {
	GameRecord record = getRecords().get(rowIndex);
	switch (columnIndex) {
	case 0:
	    return record.getName();
	case 1:
	    return record.getProfile();
	case 2:
	    return record.getPlaneCount();
	case 3:
	    return record.getDate();
	case 4:
	    return record.getMapName();
	}
	return "?";
    }

    /**
         * @return the atcHandler
         */
    private AtcHandler getAtcHandler() {
	return atcHandler;
    }

    /**
         * @param atcHandler
         *                the atcHandler to set
         */
    public void setAtcHandler(AtcHandler atcHandler) {
	this.atcHandler = atcHandler;
    }

    /**
         * @return the records
         */
    private List<GameRecord> getRecords() {
	return records;
    }
}
