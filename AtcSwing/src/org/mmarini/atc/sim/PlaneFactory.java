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

	private Random random = new Random();

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

	/**
	 * @param random
	 *            the random to set
	 */
	public void setRandom(Random random) {
		this.random = random;
	}

	/**
	 * @param templateList
	 *            the templateList to set
	 */
	public void setTemplateList(List<PlaneModel> planeTemplateList) {
		this.templateList = planeTemplateList;
	}

}
