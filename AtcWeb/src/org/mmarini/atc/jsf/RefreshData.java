/**
 * 
 */
package org.mmarini.atc.jsf;

import java.util.ArrayList;
import java.util.List;

/**
 * @author US00852
 * 
 */
public class RefreshData {
	private String command;
	private List<String> planePane;
	private List<String> logPane;
	private List<JsonPlane> planeList;

	/**
	 * 
	 */
	public RefreshData() {
		planePane = new ArrayList<>();
		logPane = new ArrayList<>();
		planeList = new ArrayList<>();
	}

	/**
	 * 
	 * @return
	 */
	public String getCommand() {
		return command;
	}

	/**
	 * @return the logPane
	 */
	public List<String> getLogPane() {
		return logPane;
	}

	/**
	 * @return the planeMap
	 */
	public List<JsonPlane> getPlaneList() {
		return planeList;
	}

	/**
	 * @return the planePane
	 */
	public List<String> getPlanePane() {
		return planePane;
	}

	/**
	 * 
	 * @param command
	 */
	public void setCommand(String command) {
		this.command = command;
	}

	/**
	 * @param logPane
	 *            the logPane to set
	 */
	public void setLogPane(List<String> logPane) {
		this.logPane = logPane;
	}

	/**
	 * @param planeMap
	 *            the planeMap to set
	 */
	public void setPlaneList(List<JsonPlane> planeMap) {
		this.planeList = planeMap;
	}

	/**
	 * @param planePane
	 *            the planePane to set
	 */
	public void setPlanePane(List<String> planePane) {
		this.planePane = planePane;
	}
}
