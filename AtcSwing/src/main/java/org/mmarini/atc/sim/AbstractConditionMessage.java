/*
 * AbstractConditionMessage.java
 *
 * $Id: AbstractConditionMessage.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AbstractConditionMessage.java,v 1.2 2008/02/15 18:06:58 marco
 *          Exp $
 * 
 */
public abstract class AbstractConditionMessage extends AbstractMessage {
	private String conditionId;

	/**
	 * @return the conditionId
	 */
	public String getConditionId() {
		return conditionId;
	}

	/**
	 * @param conditionId
	 *            the conditionId to set
	 */
	public void setConditionId(String conditionId) {
		this.conditionId = conditionId;
	}
}
