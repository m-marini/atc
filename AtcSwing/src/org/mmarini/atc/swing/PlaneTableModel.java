/*
 * PlaneTableModel.java
 *
 * $Id: PlaneTableModel.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 05/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.swing;

import java.util.ArrayList;
import java.util.List;

import javax.swing.table.AbstractTableModel;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.Plane;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneTableModel.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 */
public class PlaneTableModel extends AbstractTableModel implements Refreshable {

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private List<Plane> planeList = new ArrayList<Plane>(0);

	private AtcHandler atcHandler;

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @see javax.swing.table.AbstractTableModel#getColumnClass(int)
	 */
	@Override
	public Class<?> getColumnClass(int columnIndex) {
		switch (columnIndex) {
		case 1:
		case 2:
		case 3:
			return Integer.class;
		}
		return String.class;
	}

	/**
         * 
         */
	@Override
	public int getColumnCount() {
		return 5;
	}

	/**
	 * @see javax.swing.table.AbstractTableModel#getColumnName(int)
	 */
	@Override
	public String getColumnName(int column) {
		switch (column) {
		case 0:
			return "ID";
		case 1:
			return "FL";
		case 2:
			return "SPEED";
		case 3:
			return "HDG";
		case 4:
			return "Dest.";
		}
		return "?";
	}

	/**
	 * @return the planeList
	 */
	private List<Plane> getPlaneList() {
		return planeList;
	}

	/**
         * 
         */
	@Override
	public int getRowCount() {
		return getPlaneList().size();
	}

	/**
         * 
         */
	@Override
	public Object getValueAt(int rowIndex, int columnIndex) {
		Plane plane = getPlaneList().get(rowIndex);
		switch (columnIndex) {
		case 0:
			return plane.getId();
		case 1:
			return plane.getAltitude() / 1000;
		case 2:
			return plane.getSpeed();
		case 3:
			return plane.getHeading();
		case 4:
			return plane.getDestinationId();
		}
		return "?";
	}

	/**
         * 
         * 
         */
	@Override
	public void refresh() {
		List<Plane> list = getAtcHandler().retrievePlanes();
		List<Plane> data = getPlaneList();
		data.clear();
		data.addAll(list);
		fireTableDataChanged();
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}
}
