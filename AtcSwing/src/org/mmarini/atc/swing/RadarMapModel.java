/*
 * RadarMapModel.java
 *
 * $Id: RadarMapModel.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.util.List;

import javax.swing.AbstractListModel;
import javax.swing.ComboBoxModel;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.RadarMap;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: RadarMapModel.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class RadarMapModel extends AbstractListModel<String> implements
		ComboBoxModel<String>, Refreshable {

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private AtcHandler atcHandler;

	private List<RadarMap> list;

	private int selectedIndex;

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @see javax.swing.ListModel#getElementAt(int)
	 */
	@Override
	public String getElementAt(int n) {
		RadarMap map = list.get(n);
		return map.getId() + " - " + map.getName();
	}

	/**
	 * @return the list
	 */
	private List<RadarMap> getList() {
		return list;
	}

	/**
	 * 
	 * @return
	 */
	public String getSelectedId() {
		return getList().get(getSelectedIndex()).getId();
	}

	/**
	 * @return the selectedIndex
	 */
	public int getSelectedIndex() {
		return selectedIndex;
	}

	/**
         * 
         */
	@Override
	public Object getSelectedItem() {
		int idx = getSelectedIndex();
		if (idx < 0)
			return null;
		return getElementAt(idx);
	}

	/**
	 * @see javax.swing.ListModel#getSize()
	 */
	@Override
	public int getSize() {
		return list.size();
	}

	/**
         * 
         * 
         */
	@Override
	public void refresh() {
		List<RadarMap> list = getAtcHandler().retrieveRadarMap();
		setList(list);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param list
	 *            the list to set
	 */
	private void setList(List<RadarMap> list) {
		List<RadarMap> old = getList();
		int no = 0;
		if (old != null) {
			no = old.size();
		}
		this.list = list;
		int n = list.size();
		if (n > no) {
			if (no > 0) {
				fireContentsChanged(this, 0, no - 1);
			}
			fireIntervalAdded(this, no, n - 1);
		} else {
			if (n > 0) {
				fireContentsChanged(this, 0, n - 1);
			}
			if (n < no) {
				fireIntervalRemoved(this, n, no - 1);
			}
		}
	}

	/**
	 * @param selectedIndex
	 *            the selectedIndex to set
	 */
	public void setSelectedIndex(int selectedIndex) {
		this.selectedIndex = selectedIndex;
	}

	/**
         * 
         */
	@Override
	public void setSelectedItem(Object item) {
		int idx = -1;
		List<RadarMap> list = getList();
		int n = list.size();
		for (int i = 0; i < n; ++i) {
			if (getElementAt(i).equals(item)) {
				idx = i;
				break;
			}
		}
		setSelectedIndex(idx);
	}
}
