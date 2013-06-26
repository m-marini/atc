/*
 * DefaultLocation.java
 *
 * $Id: DefaultLocation.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: DefaultLocation.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public class DefaultLocation implements Location, AtcConstants {
    private String id = String.valueOf(System.identityHashCode(this));

    private Position position = new Position();

    private String alignment = EAST;

    /**
         * @return the id
         */
    public String getId() {
	return id;
    }

    /**
         * @param id
         *                the id to set
         */
    public void setId(String id) {
	this.id = id;
    }

    /**
         * @param position
         * @return
         */
    protected boolean isInRange(Position position) {
	return getPosition().isInRange(position, INRANGE_DISTANCE);
    }

    /**
         * @return the position
         */
    public Position getPosition() {
	return position;
    }

    /**
         * @param position
         *                the position to set
         */
    public void setPosition(Position position) {
	getPosition().setPosition(position);
    }

    /**
         * @see java.lang.Object#toString()
         */
    @Override
    public String toString() {
	StringBuffer bfr = new StringBuffer();
	bfr.append(getClass().getName());
	bfr.append("(");
	bfr.append(getId());
	bfr.append(")");
	return bfr.toString();
    }

    /**
         * 
         */
    public void update() {
    }

    /**
         * @return the alignment
         */
    public String getAlignment() {
	return alignment;
    }

    /**
         * @param alignment
         *                the alignment to set
         */
    public void setAlignment(String alignment) {
	this.alignment = alignment;
    }
}
