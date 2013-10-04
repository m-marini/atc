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
import java.util.List;

import javax.faces.model.SelectItem;
import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.ChangeFlightLevelMessage;
import org.mmarini.atc.sim.ClearToLandMessage;
import org.mmarini.atc.sim.DefaultRunway;
import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.HoldMessage;
import org.mmarini.atc.sim.Location;
import org.mmarini.atc.sim.Logger;
import org.mmarini.atc.sim.Plane;
import org.mmarini.atc.sim.RadarMap;
import org.mmarini.atc.sim.TurnToMessage;
import org.slf4j.LoggerFactory;

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

	private static org.slf4j.Logger log = LoggerFactory
			.getLogger(UserGame.class);

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
     */
	private void checkForGameOver() {
		if (atcHandler.getCollisionCount() > 0
				|| atcHandler.getCrashCount() > 0
				|| atcHandler.getWrongExitCount() > 0) {
			exitGame();
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

		response.setContentType(IMAGE_MIME_FORMAT);
		OutputStream os = response.getOutputStream();
		Dimension size = SIZE;
		BufferedImage image = new BufferedImage(size.width, size.height,
				BufferedImage.TYPE_INT_RGB);
		Graphics gr = image.createGraphics();
		atcHandler.paintRadar(gr, size);
		gr.dispose();
		ImageIO.write(image, IMAGE_TYPE, os);
	}

	/**
         * 
         * 
         */
	public void exitGame() {
		log.debug("Game Over");
		setGameOver(true);
		setRecord(atcHandler.createRecord());
		if (atcHandler.getCollisionCount() > 0) {
			setEndGameReason(COLLISION);
		} else if (atcHandler.getCrashCount() > 0) {
			setEndGameReason(CRASH);
		} else if (atcHandler.getWrongExitCount() > 0) {
			setEndGameReason(WRONG_EXIT);
		} else {
			setEndGameReason(USER_EXIT);
		}
	}

	/**
	 * @return the endGameReason
	 */
	public String getEndGameReason() {
		return endGameReason;
	}

	/**
	 * @return the hitsBean
	 */
	private HitsBean getHitsBean() {
		return hitsBean;
	}

	/**
	 * @return the level
	 */
	public String getLevel() {
		return level;
	}

	/**
	 * @return the locationList
	 */
	public List<String> getLocationList() {
		return locationList;
	}

	/**
	 * @return the logRows
	 */
	public List<String> getLogRows() {
		return logRows;
	}

	/**
	 * @return the map
	 */
	public String getMap() {
		return map;
	}

	/**
	 * @return the mapList
	 */
	public SelectItem[] getMapList() {
		if (mapList == null) {
			log.debug("getMapList");
			List<RadarMap> list = atcHandler.retrieveRadarMap();
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
	 * 
	 * @return
	 */
	public String getMapUrl() {
		return "map/" + map.toLowerCase() + ".xml";
	}

	/**
	 * @return the planeList
	 */
	public List<Plane> getPlaneList() {
		return planeList;
	}

	/**
	 * @return the planeListLog
	 */
	public List<String> getPlaneListLog() {
		return planeListLog;
	}

	/**
	 * @return the radarMap
	 */
	public String getRadarMap() {
		return radarMap;
	}

	/**
	 * @return the record
	 */
	public GameRecord getRecord() {
		return record;
	}

	/**
	 * @return the runwayList
	 */
	public List<String> getRunwayList() {
		return runwayList;
	}

	/**
	 * 
	 * @return
	 */
	public boolean isBetterRecord() {
		return atcHandler.isBetter();
	}

	/**
	 * @return the gameOver
	 */
	public boolean isGameOver() {
		return gameOver;
	}

	/**
	 * 
	 * @param message
	 */
	@Override
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
	public void refresh() {
		atcHandler.updateSession();
		checkForGameOver();
		reloadPlaneList();
		refreshLog();
	}

	/**
         * 
         * 
         */
	private void refreshLog() {
		atcHandler.retrieveMessages(this);
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
			atcHandler.register(id);
			getHitsBean().store();
		}
		return GAME_PAGE;
	}

	/**
         * 
         * 
         */
	private void reloadLocations() {
		List<Location> list = atcHandler.retrieveMapLocations();
		List<String> items = getLocationList();
		items.clear();
		for (Location loc : list) {
			items.add(loc.getId());
		}
	}

	/**
         * 
         * 
         */
	private void reloadPlaneList() {
		List<Plane> planeList = atcHandler.retrievePlanes();
		setPlaneList(planeList);
		planeListLog.clear();
		for (Plane plane : planeList) {
			for (String template : PLANE_MESSAGE) {
				String txt = MessageFormat.format(template, plane.getId(),
						plane.getFlightLevelId(), plane.getClassId(),
						plane.getDestinationId(), plane.getHeading(),
						plane.getStatus());
				if (txt.trim().length() > 0) {
					planeListLog.add(txt);
				}
			}
			planeListLog.add("");
		}
	}

	/**
	 * 
	 */
	private void reloadRunways() {
		List<DefaultRunway> list = atcHandler.retrieveRunways();
		runwayList.clear();
		if (list != null) {
			for (DefaultRunway runway : list) {
				runwayList.add(runway.getId());
			}
		}
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
		atcHandler.consume(message);
		refreshLog();
		checkForGameOver();
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
		atcHandler.consume(message);
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
		atcHandler.consume(message);
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
		atcHandler.consume(message);
		refreshLog();
		checkForGameOver();
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param endGameReason
	 *            the endGameReason to set
	 */
	private void setEndGameReason(String endGameReason) {
		this.endGameReason = endGameReason;
	}

	/**
	 * @param gameOver
	 *            the gameOver to set
	 */
	private void setGameOver(boolean gameOver) {
		this.gameOver = gameOver;
	}

	/**
	 * @param hitsBean
	 *            the hitsBean to set
	 */
	public void setHitsBean(HitsBean hitsBean) {
		this.hitsBean = hitsBean;
	}

	/**
	 * @param level
	 *            the level to set
	 */
	public void setLevel(String level) {
		this.level = level;
	}

	/**
	 * @param map
	 *            the map to set
	 */
	public void setMap(String map) {
		this.map = map;
	}

	/**
	 * @param planeList
	 *            the planeList to set
	 */
	private void setPlaneList(List<Plane> planeList) {
		this.planeList = planeList;
	}

	/**
	 * @param radarMap
	 *            the radarMap to set
	 */
	public void setRadarMap(String radarMap) {
		this.radarMap = radarMap;
	}

	/**
	 * @param record
	 *            the record to set
	 */
	private void setRecord(GameRecord record) {
		this.record = record;
	}

	/**
	 * 
	 * @return
	 */
	public String startGame() {
		log.debug("startGame()");
		setGameOver(false);
		getLogRows().clear();
		String mapId = getMap();
		String level = getLevel();
		atcHandler.createSession(mapId, level);
		reloadPlaneList();
		log("Simulation started.");
		refreshLog();
		reloadRunways();
		reloadLocations();
		return ATC_PANE;
	}
}
