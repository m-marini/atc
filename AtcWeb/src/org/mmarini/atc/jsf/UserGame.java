/*
 * UserGame.java
 *
 * $Id: UserGame.java,v 1.4 2008/03/01 21:17:52 marco Exp $
 *
 * 26/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.jsf;

import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.io.Serializable;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import javax.faces.model.SelectItem;
import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.ChangeFlightLevelMessage;
import org.mmarini.atc.sim.ClearToLandMessage;
import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.Gateway;
import org.mmarini.atc.sim.HoldMessage;
import org.mmarini.atc.sim.Location;
import org.mmarini.atc.sim.Logger;
import org.mmarini.atc.sim.Plane;
import org.mmarini.atc.sim.RadarMap;
import org.mmarini.atc.sim.TurnToMessage;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UserGame.java,v 1.4 2008/03/01 21:17:52 marco Exp $
 * 
 */
public class UserGame implements Logger, Serializable {

	private static final String DEFAULT_ID = "---";

	public static final String GAME_PAGE = "gamePage";

	public static final String COLLISION = "endGame.collision.text";

	public static final String CRASH = "endGame.crash.text";

	public static final String WRONG_EXIT = "endGame.wrongExit.text";

	public static final String USER_EXIT = "endGame.userExit.text";

	public static final String IMAGE_TYPE = "png";

	public static final String IMAGE_MIME_FORMAT = "image/png";

	public static final String ATC_PANE = "atcPane";

	public static final Dimension SIZE = new Dimension(580, 580);

	private static final String[] PLANE_MESSAGE = {
			"ID: {0}-{2}        FL {1}", "      to {3}    Hdg {4}",
			"       {5}" };

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private static Log log = LogFactory.getLog(UserGame.class);

	private AtcHandler atcHandler;

	private String radarMap;

	private String level = "training";

	private String map = "LRX";

	private SelectItem[] mapList;

	private List<String> planeListLog = new ArrayList<String>(0);

	private List<Plane> planeList;

	private List<String> logRows = new ArrayList<String>(0);

	private List<String> runwayList = new ArrayList<String>(0);;

	private List<String> locationList = new ArrayList<String>(0);;

	private boolean gameOver;

	private GameRecord record;

	private String endGameReason;

	private HitsBean hitsBean;

	/**
         * 
         */
	public UserGame() {
		log.debug("Created");
	}

	/**
	 * 
	 * @return
	 */
	public String startGame() {
		log.debug("startGame()");
		setGameOver(false);
		getLogRows().clear();
		AtcHandler handler = getAtcHandler();
		String mapId = getMap();
		String level = getLevel();
		handler.createSession(mapId, level);
		reloadPlaneList();
		log("Simulation started.");
		refreshLog();
		reloadRunways();
		reloadLocations();
		return ATC_PANE;
	}

	/**
         * 
         * 
         */
	private void reloadLocations() {
		AtcHandler handler = getAtcHandler();
		List<Location> list = handler.retrieveMapLocations();
		List<String> items = getLocationList();
		items.clear();
		for (Iterator<Location> i = list.iterator(); i.hasNext();) {
			items.add(i.next().getId());
		}
	}

	/**
         * 
         * 
         */
	private void reloadRunways() {
		AtcHandler handler = getAtcHandler();
		List<Gateway> list = handler.retrieveRunways();
		List<String> items = getRunwayList();
		items.clear();
		if (list == null)
			return;
		for (Iterator<Gateway> i = list.iterator(); i.hasNext();) {
			items.add(i.next().getId());
		}
	}

	/**
	 * 
	 * @param request
	 * @param response
	 * @throws IOException
	 */
	public void createRadarMap(HttpServletRequest request,
			HttpServletResponse response) throws IOException {
		AtcHandler handler = getAtcHandler();

		response.setContentType(IMAGE_MIME_FORMAT);
		OutputStream os = response.getOutputStream();
		Dimension size = SIZE;
		BufferedImage image = new BufferedImage(size.width, size.height,
				BufferedImage.TYPE_INT_RGB);
		Graphics gr = image.createGraphics();
		handler.paintRadar(gr, size);
		gr.dispose();
		ImageIO.write(image, IMAGE_TYPE, os);
	}

	/**
         * 
         * 
         */
	public void refresh() {
		AtcHandler handler = getAtcHandler();
		handler.updateSession();
		checkForGameOver();
		reloadPlaneList();
		refreshLog();
	}

	/**
     */
	private void checkForGameOver() {
		AtcHandler handler = getAtcHandler();
		if (handler.getCollisionCount() > 0 || handler.getCrashCount() > 0
				|| handler.getWrongExitCount() > 0) {
			exitGame();
		}
	}

	/**
	 * 
	 * @param message
	 */
	public void log(String message) {
		List<String> list = getLogRows();
		String txt = MessageFormat.format("{0,time} {1}", new Object[] {
				new Date(), message });
		list.add(txt);
		int n = list.size() - 10;
		if (n > 0) {
			list.subList(0, n - 1).clear();
		}
	}

	/**
         * 
         * 
         */
	private void refreshLog() {
		getAtcHandler().retrieveMessages(this);
	}

	/**
	 * @return the atcHandler
	 */
	public AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @return the radarMap
	 */
	public String getRadarMap() {
		return radarMap;
	}

	/**
	 * @param radarMap
	 *            the radarMap to set
	 */
	public void setRadarMap(String radarMap) {
		this.radarMap = radarMap;
	}

	/**
	 * @return the level
	 */
	public String getLevel() {
		return level;
	}

	/**
	 * @param level
	 *            the level to set
	 */
	public void setLevel(String level) {
		this.level = level;
	}

	/**
	 * @return the map
	 */
	public String getMap() {
		return map;
	}

	/**
	 * @param map
	 *            the map to set
	 */
	public void setMap(String map) {
		this.map = map;
	}

	/**
	 * @return the mapList
	 */
	public SelectItem[] getMapList() {
		if (mapList == null) {
			log.debug("getMapList");
			List<RadarMap> list = getAtcHandler().retrieveRadarMap();
			int n = list.size();
			mapList = new SelectItem[n];
			for (int i = 0; i < n; ++i) {
				RadarMap map = list.get(i);
				mapList[i] = new SelectItem(map.getId(), map.getName());
			}
		}
		return mapList;
	}

	/**
	 * @return the planeListLog
	 */
	public List<String> getPlaneListLog() {
		return planeListLog;
	}

	/**
         * 
         * 
         */
	private void reloadPlaneList() {
		List<Plane> planeList = getAtcHandler().retrievePlanes();
		setPlaneList(planeList);
		List<String> rows = getPlaneListLog();
		rows.clear();
		for (Iterator<Plane> i = planeList.iterator(); i.hasNext();) {
			Plane plane = i.next();
			Object[] data = { plane.getId(), plane.getFlightLevelId(),
					plane.getClassId(), plane.getDestinationId(),
					plane.getHeading(), plane.getStatus() };
			for (int j = 0; j < PLANE_MESSAGE.length; ++j) {
				String txt = MessageFormat.format(PLANE_MESSAGE[j], data);
				if (txt.trim().length() > 0) {
					rows.add(txt);
				}
			}
			rows.add("");
		}
	}

	/**
	 * @return the logRows
	 */
	public List<String> getLogRows() {
		return logRows;
	}

	/**
	 * @return the planeList
	 */
	public List<Plane> getPlaneList() {
		return planeList;
	}

	/**
	 * @param planeList
	 *            the planeList to set
	 */
	private void setPlaneList(List<Plane> planeList) {
		this.planeList = planeList;
	}

	/**
	 * @return the runwayList
	 */
	public List<String> getRunwayList() {
		return runwayList;
	}

	/**
	 * @return the locationList
	 */
	public List<String> getLocationList() {
		return locationList;
	}

	/**
	 * 
	 * @param planeId
	 * @param flightLevelId
	 */
	public void sendFlightLevel(String planeId, String flightLevelId) {
		ChangeFlightLevelMessage message = new ChangeFlightLevelMessage();
		message.setPlaneId(planeId);
		message.setFlightLevelId(flightLevelId);
		getAtcHandler().consume(message);
		refreshLog();
		checkForGameOver();
	}

	/**
	 * 
	 * @param planeId
	 * @param locationId
	 */
	public void sendClearToLand(String planeId, String locationId) {
		ClearToLandMessage message = new ClearToLandMessage();
		message.setPlaneId(planeId);
		message.setLocationId(locationId);
		getAtcHandler().consume(message);
		refreshLog();
		checkForGameOver();
	}

	/**
	 * 
	 * @param planeId
	 * @param condId
	 */
	public void sendHold(String planeId, String condId) {
		HoldMessage message = new HoldMessage();
		message.setPlaneId(planeId);
		if (!"Immediate".equals(condId))
			message.setConditionId(condId);
		getAtcHandler().consume(message);
		refreshLog();
		checkForGameOver();
	}

	/**
	 * 
	 * @param planeId
	 * @param condId
	 */
	public void sendTurnTo(String planeId, String locationId, String condId) {
		TurnToMessage message = new TurnToMessage();
		message.setPlaneId(planeId);
		message.setLocationId(locationId);
		if (!"Immediate".equals(condId))
			message.setConditionId(condId);
		getAtcHandler().consume(message);
		refreshLog();
		checkForGameOver();
	}

	/**
	 * @return the gameOver
	 */
	public boolean isGameOver() {
		return gameOver;
	}

	/**
	 * 
	 * @return
	 */
	public boolean isBetterRecord() {
		return getAtcHandler().isBetter();
	}

	/**
	 * @param gameOver
	 *            the gameOver to set
	 */
	private void setGameOver(boolean gameOver) {
		this.gameOver = gameOver;
	}

	/**
         * 
         * 
         */
	public void exitGame() {
		log.debug("Game Over");
		setGameOver(true);
		AtcHandler handler = getAtcHandler();
		setRecord(handler.createRecord());
		if (handler.getCollisionCount() > 0) {
			setEndGameReason(COLLISION);
		} else if (handler.getCrashCount() > 0) {
			setEndGameReason(CRASH);
		} else if (handler.getWrongExitCount() > 0) {
			setEndGameReason(WRONG_EXIT);
		} else {
			setEndGameReason(USER_EXIT);
		}
	}

	/**
	 * 
	 * @return
	 */
	public String register() {
		if (isBetterRecord()) {
			GameRecord record = getRecord();
			String id = record.getName();
			if (id.length() == 0) {
				id = DEFAULT_ID;
				record.setName(id);
			}
			getAtcHandler().register(id);
			getHitsBean().store();
		}
		return GAME_PAGE;
	}

	/**
	 * @return the record
	 */
	public GameRecord getRecord() {
		return record;
	}

	/**
	 * @param record
	 *            the record to set
	 */
	private void setRecord(GameRecord record) {
		this.record = record;
	}

	/**
	 * @return the endGameReason
	 */
	public String getEndGameReason() {
		return endGameReason;
	}

	/**
	 * @param endGameReason
	 *            the endGameReason to set
	 */
	private void setEndGameReason(String endGameReason) {
		this.endGameReason = endGameReason;
	}

	/**
	 * @return the hitsBean
	 */
	private HitsBean getHitsBean() {
		return hitsBean;
	}

	/**
	 * @param hitsBean
	 *            the hitsBean to set
	 */
	public void setHitsBean(HitsBean hitsBean) {
		this.hitsBean = hitsBean;
	}
}
