/**
 * 
 */
package org.mmarini.atc.jsf;

/**
 * @author US00852
 * 
 */
public class JsonPlane {
	private String id;
	private double x;
	private double y;
	private int heading;
	private String flightLevel;
	private int speed;
	private String classId;

	/**
	 * 
	 */
	public JsonPlane() {
	}

	/**
	 * @return the classId
	 */
	public String getClassId() {
		return classId;
	}

	/**
	 * @return the flightLevel
	 */
	public String getFlightLevel() {
		return flightLevel;
	}

	/**
	 * @return the course
	 */
	public int getHeading() {
		return heading;
	}

	/**
	 * @return the id
	 */
	public String getId() {
		return id;
	}

	/**
	 * @return the speed
	 */
	public int getSpeed() {
		return speed;
	}

	/**
	 * @return the x
	 */
	public double getX() {
		return x;
	}

	/**
	 * @return the y
	 */
	public double getY() {
		return y;
	}

	/**
	 * @param classId
	 *            the classId to set
	 */
	public void setClassId(String classId) {
		this.classId = classId;
	}

	/**
	 * @param flightLevel
	 *            the flightLevel to set
	 */
	public void setFlightLevel(String flightLevel) {
		this.flightLevel = flightLevel;
	}

	/**
	 * @param course
	 *            the course to set
	 */
	public void setHeading(int course) {
		this.heading = course;
	}

	/**
	 * @param id
	 *            the id to set
	 */
	public void setId(String id) {
		this.id = id;
	}

	/**
	 * @param speed
	 *            the speed to set
	 */
	public void setSpeed(int speed) {
		this.speed = speed;
	}

	/**
	 * @param x
	 *            the x to set
	 */
	public void setX(double x) {
		this.x = x;
	}

	/**
	 * @param y
	 *            the y to set
	 */
	public void setY(double y) {
		this.y = y;
	}

}
