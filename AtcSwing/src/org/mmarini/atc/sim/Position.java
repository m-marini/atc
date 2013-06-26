/*
 * Position.java
 *
 * $Id: Position.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Position.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public class Position implements AtcConstants {
    private float x;

    private float y;

    /**
         * 
         */
    public Position() {
    }

    /**
         * @param x
         * @param y
         */
    public Position(float x, float y) {
	this.x = x;
	this.y = y;
    }

    /**
         * 
         * @param position
         */
    public void setPosition(Position position) {
	setX(position.getX());
	setY(position.getY());
    }

    /**
         * 
         * @param position
         * @param range
         * @return
         */
    public boolean isInRange(Position position, float range) {
	return distance2(position) <= (range * range);
    }

    /**
         * @param position
         * @return
         */
    private float distance2(Position position) {
	float dx = getX() - position.getX();
	float dy = getY() - position.getY();
	float d = (dx * dx + dy * dy);
	return d;
    }

    /**
         * 
         * @return
         */
    public boolean isInRange(float range) {
	float dx = getX();
	float dy = getY();
	return (dx * dx + dy * dy) <= (range * range);
    }

    /**
         * 
         * @param course
         * @param speed
         */
    public void move(int course, float speed) {
	double rads = Math.toRadians(course);
	float dx = (float) (speed * Math.sin(rads));
	float dy = (float) (speed * Math.cos(rads));
	setX(getX() + dx);
	setY(getY() + dy);
    }

    /*
         * (non-Javadoc)
         * 
         * @see java.lang.Object#hashCode()
         */
    @Override
    public int hashCode() {
	final int PRIME = 31;
	int result = 1;
	result = PRIME * result + Float.floatToIntBits(x);
	result = PRIME * result + Float.floatToIntBits(y);
	return result;
    }

    /*
         * (non-Javadoc)
         * 
         * @see java.lang.Object#equals(java.lang.Object)
         */
    @Override
    public boolean equals(Object obj) {
	if (this == obj)
	    return true;
	if (obj == null)
	    return false;
	if (getClass() != obj.getClass())
	    return false;
	final Position other = (Position) obj;
	if (Float.floatToIntBits(x) != Float.floatToIntBits(other.x))
	    return false;
	if (Float.floatToIntBits(y) != Float.floatToIntBits(other.y))
	    return false;
	return true;
    }

    /**
         * @return the x
         */
    public float getX() {
	return x;
    }

    /**
         * @param x
         *                the x to set
         */
    public void setX(float x) {
	this.x = x;
    }

    /**
         * @return the y
         */
    public float getY() {
	return y;
    }

    /**
         * @param y
         *                the y to set
         */
    public void setY(float y) {
	this.y = y;
    }

    /**
         * @see java.lang.Object#toString()
         */
    @Override
    public String toString() {
	StringBuffer bfr = new StringBuffer();
	bfr.append("(");
	bfr.append(getX());
	bfr.append(",");
	bfr.append(getY());
	bfr.append(")");
	return bfr.toString();
    }

    /**
         * 
         * @param position
         * @return
         */
    public int routeTo(Position position) {
	float dx = position.getX() - getX();
	float dy = position.getY() - getY();
	int routeTo = (int) Math
		.round(Math.toDegrees(Math.atan2(dx, dy)) + 360);
	routeTo %= 360;
	return routeTo;
    }

    /**
         * 
         * @param position
         * @return
         */
    public float getDistance(Position position) {
	return (float) Math.sqrt(distance2(position));
    }
}
