/**
 * 
 */
package org.mmarini.atc.sim;

import java.util.Date;

/**
 * @author Marco
 * 
 */
public class GameRecord implements Comparable<GameRecord> {
	public static final String[] PROFILES = { "hard", "difficult", "medium",
			"easy", "training" };

	private long time = System.currentTimeMillis();

	private int planeCount;

	private int iterationCount;

	private String profile = "";

	private String name = "";

	private String mapName = "";

	/**
         * 
         */
	@Override
	public int compareTo(GameRecord record) {
		int dp = getProfileOrdinal() - record.getProfileOrdinal();
		if (dp != 0)
			return dp;
		int np = record.getPlaneCount() - getPlaneCount();
		if (np != 0)
			return np;
		if (getTime() < record.getTime())
			return -1;
		if (getTime() > record.getTime())
			return 1;
		return 0;
	}

	/**
	 * 
	 * @return
	 */
	public Date getDate() {
		return new Date(getTime());
	}

	/**
	 * @return the iterationCount
	 */
	public int getIterationCount() {
		return iterationCount;
	}

	/**
	 * 
	 * @return
	 */
	public String getMapName() {
		return mapName;
	}

	/**
	 * @return the name
	 */
	public String getName() {
		return name;
	}

	/**
	 * @return the planeCount
	 */
	public int getPlaneCount() {
		return planeCount;
	}

	/**
	 * @return the level
	 */
	public String getProfile() {
		return profile;
	}

	/**
	 * 
	 * @return
	 */
	private int getProfileOrdinal() {
		int n = PROFILES.length;
		String profile = getProfile();
		for (int i = 0; i < n; ++i) {
			if (PROFILES[i].equals(profile))
				return i;
		}
		return n;
	}

	/**
	 * @return the time
	 */
	public long getTime() {
		return time;
	}

	/**
	 * @param iterationCount
	 *            the iterationCount to set
	 */
	public void setIterationCount(int iterationCount) {
		this.iterationCount = iterationCount;
	}

	/**
	 * 
	 * @param mapName
	 */
	public void setMapName(String map) {
		this.mapName = map;
	}

	/**
	 * @param name
	 *            the name to set
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * @param planeCount
	 *            the planeCount to set
	 */
	public void setPlaneCount(int planeCount) {
		this.planeCount = planeCount;
	}

	/**
	 * @param level
	 *            the level to set
	 */
	public void setProfile(String level) {
		this.profile = level;
	}

	/**
	 * @param time
	 *            the time to set
	 */
	public void setTime(long time) {
		this.time = time;
	}

	/**
	 * @see java.lang.Object#toString()
	 */
	@Override
	public String toString() {
		StringBuffer bfr = new StringBuffer();
		bfr.append(",");
		bfr.append(getProfile());
		bfr.append(getName());
		bfr.append(",");
		bfr.append(getPlaneCount());
		bfr.append(",");
		bfr.append(getDate());
		bfr.append(",");
		bfr.append(getIterationCount());
		return bfr.toString();
	}
}
