/*
 * PlaneFactory.java
 *
 * $Id: PlaneFactory.java,v 1.2 2008/02/15 18:06:59 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneFactory.java,v 1.2 2008/02/15 18:06:59 marco Exp $
 * 
 */
public class PlaneFactory {
	private List<PlaneModel> templateList;
	private int count;
	private Random random;

	/**
	 * 
	 */
	public PlaneFactory() {
		random = new Random();
		templateList = new ArrayList<>();

		createPlaneModel("J", 0.25f, 0.8f, 300);
		createPlaneModel("A", 0.2f, 0.5f, 150);
	}

	/**
	 * 
	 * @return
	 */
	public Plane createPlane() {
		int ct = getCount();
		String id = String.valueOf((char) ('A' + (ct % 26))) + ct / 26;
		ct = ct + 1;
		setCount(ct);
		PlaneModel model = selectModel();
		DefaultPlane plane = new DefaultPlane();
		plane.setId(id);
		plane.setModel(model);
		return plane;
	}

	/**
	 * 
	 * @param classId
	 * @param lowSpeed
	 * @param highSpeed
	 * @param vSpeed
	 */
	private void createPlaneModel(String classId, float lowSpeed,
			float highSpeed, int vSpeed) {
		PlaneModel model = new PlaneModel();
		model.setClassId(classId);
		model.setLowSpeed(lowSpeed);
		model.setHighSpeed(highSpeed);
		model.setVSpeed(vSpeed);

		templateList.add(model);
	}

	/**
	 * @return the count
	 */
	private int getCount() {
		return count;
	}

	/**
	 * @return the random
	 */
	private Random getRandom() {
		return random;
	}

	/**
	 * @return the templateList
	 */
	private List<PlaneModel> getTemplateList() {
		return templateList;
	}

	/**
	 * 
	 * @return
	 */
	private PlaneModel selectModel() {
		List<PlaneModel> list = getTemplateList();
		int idx = getRandom().nextInt(list.size());
		return list.get(idx);
	}

	/**
	 * @param count
	 *            the count to set
	 */
	private void setCount(int count) {
		this.count = count;
	}

}
