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
	 * @return the id
	 */
	public String getId() {
		return id;
	}

	/**
	 * @param id the id to set
	 */
	public void setId(String id) {
		this.id = id;
	}

	/**
	 * @return the x
	 */
	public double getX() {
		return x;
	}

	/**
	 * @param x the x to set
	 */
	public void setX(double x) {
		this.x = x;
	}

	/**
	 * @return the y
	 */
	public double getY() {
		return y;
	}

	/**
	 * @param y the y to set
	 */
	public void setY(double y) {
		this.y = y;
	}

	/**
	 * @return the course
	 */
	public int getHeading() {
		return heading;
	}

	/**
	 * @param course the course to set
	 */
	public void setHeading(int course) {
		this.heading = course;
	}

	/**
	 * @return the flightLevel
	 */
	public String getFlightLevel() {
		return flightLevel;
	}

	/**
	 * @param flightLevel the flightLevel to set
	 */
	public void setFlightLevel(String flightLevel) {
		this.flightLevel = flightLevel;
	}

	/**
	 * @return the speed
	 */
	public int getSpeed() {
		return speed;
	}

	/**
	 * @param speed the speed to set
	 */
	public void setSpeed(int speed) {
		this.speed = speed;
	}

	/**
	 * @return the classId
	 */
	public String getClassId() {
		return classId;
	}

	/**
	 * @param classId the classId to set
	 */
	public void setClassId(String classId) {
		this.classId = classId;
	}

}
