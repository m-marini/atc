/*
 * AtcSession.java
 *
 * $Id: AtcSession.java,v 1.4 2008/03/01 21:17:53 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcSession.java,v 1.4 2008/03/01 21:17:53 marco Exp $
 * 
 */
public class AtcSession implements MessageConsumer {
	private static Logger log = LoggerFactory.getLogger(AtcSession.class);

	private RadarMap radarMap;
	private GameProfile gameProfile;
	private List<Plane> planeList;
	private Random random;
	private int crashCount;
	private int safeCount;
	private int collisionCount;
	private int wrongExitCount;
	private int iterationCount;
	private PlaneMessageDispatcher messageDispatcher;
	private List<Message> messageList;
	private PlaneFactory planeFactory;

	/**
	 * 
	 */
	public AtcSession() {
		planeList = new ArrayList<Plane>(0);
		random = new Random();
		messageList = new ArrayList<Message>(0);
		planeFactory = new PlaneFactory();
		messageDispatcher = new PlaneMessageDispatcher();
	}

	/**
	 * 
	 * @param message
	 */
	public void addMessage(Message message) {
		messageList.add(message);
	}

	/**
         * 
         */
	private void addSafePlane() {
		++safeCount;
	}

	/**
         * 
         * 
         */
	private void checkForCollisions() {
		int n = planeList.size();
		int i = 0;
		while (i < n - 1) {
			Plane plane0 = planeList.get(i);
			int j = i + 1;
			while (j < n) {
				Plane plane1 = planeList.get(j);
				if (plane0.collidesWith(plane1)) {
					log.debug("Collision between " + plane0 + " and " + plane1);
					planeList.remove(j);
					planeList.remove(i);
					--i;
					n -= 2;
					++collisionCount;
					addMessage(new CollisionMessage(plane0.getId(),
							plane1.getId()));
					break;
				}
				++j;
			}
			++i;
		}
	}

	/**
	 * 
	 * @param probability
	 * @return
	 */
	private boolean checkForEvent(double probability) {
		return random.nextDouble() < probability;
	}

	/**
         * 
         * 
         */
	private void checkForPlaneEntry() {
		if (planeList.size() < getMaxPlane()
				&& checkForEvent(getNewPlaneProbability())) {
			createNewPlane();
		}
	}

	/**
         * 
         * 
         */
	private void checkForPlaneExits() {
		for (Iterator<Plane> i = planeList.iterator(); i.hasNext();) {
			Plane plane0 = i.next();
			if (plane0.isExit()) {
				if (!plane0.isCorrectExit()) {
					addMessage(new WrongExitMessage(plane0.getId()));
					++wrongExitCount;
				} else {
					addMessage(new RightExitMessage(plane0.getId(),
							plane0.getDestinationId()));
					addSafePlane();
				}
				i.remove();
			}
		}
	}

	/**
         * 
         * 
         */
	private void checkForPlaneLanding() {
		for (Iterator<Plane> i = planeList.iterator(); i.hasNext();) {
			Plane plane0 = i.next();
			if (plane0.isCrashed()) {
				addMessage(new CrashedMessage(plane0.getId()));
				i.remove();
				++crashCount;
			} else if (plane0.isLanded()) {
				if (plane0.isCorrectExit()) {
					addMessage(new LandedMessage(plane0.getId(),
							plane0.getDestinationId()));
					log.debug("Plane " + plane0 + " landed.");
					addSafePlane();
				} else {
					addMessage(new WrongRunwayMessage(plane0.getId()));
					log.debug("Plane " + plane0 + " landed at wrong runway.");
					++wrongExitCount;
				}
				i.remove();
			}
		}
	}

	/**
	 * 
	 * @param message
	 */
	@Override
	public void consume(Message message) {
		addMessage(message);
		messageDispatcher.setSession(this);
		messageDispatcher.consume(message);
	}

	/**
	 * 
	 * @param n
	 * @return
	 */
	private int createInt(int n) {
		return random.nextInt(n);
	}

	/**
         * 
         * 
         */
	private void createNewPlane() {
		Gateway from = selectRandomGateway();
		if (from.isBusy())
			return;
		Plane plane = createPlane();
		Gateway to = selectRandomGateway();
		from.initPlane(plane);
		plane.setDestination(to);
		planeList.add(plane);
		addMessage(new EnteredMessage(plane.getId(), from.getId()));
		log.debug("Plane " + plane + " entered into " + to);
	}

	/**
	 * 
	 * @return
	 */
	private Plane createPlane() {
		return planeFactory.createPlane();
	}

	/**
	 * 
	 * @param consumer
	 */
	public void dequeueMessages(MessageConsumer consumer) {
		if (!messageList.isEmpty()) {
			for (Message m : messageList) {
				consumer.consume(m);
			}
			messageList.clear();
		}
	}

	/**
	 * 
	 * @return
	 */
	public List<Location> getBeaconList() {
		return radarMap.getBeaconList();
	}

	/**
	 * @return the collisionCount
	 */
	public int getCollisionCount() {
		return collisionCount;
	}

	/**
	 * @return the crashCount
	 */
	public int getCrashCount() {
		return crashCount;
	}

	/**
	 * 
	 * @return
	 */
	public List<Gateway> getExitList() {
		return radarMap.getExitList();
	}

	/**
	 * @return the gatewayList
	 */
	private List<Gateway> getGatewayList() {
		return radarMap.getGatewayList();
	}

	/**
	 * @return the iterationCount
	 */
	public int getIterationCount() {
		return iterationCount;
	}

	/**
	 * 
	 * @param locationId
	 * @return
	 */
	public Location getLocationById(String locationId) {
		for (Location location : getMapLocations()) {
			if (location.getId().equals(locationId))
				return location;
		}
		return null;
	}

	/**
	 * 
	 * @return
	 */
	public List<Location> getMapLocations() {
		return radarMap.getLocationList();
	}

	/**
	 * 
	 * @return
	 */
	private int getMaxPlane() {
		return gameProfile.getMaxPlane();
	}

	/**
	 * 
	 * @return
	 */
	public double getNewPlaneProbability() {
		return gameProfile.getNewPlaneProbability();
	}

	/**
	 * 
	 * @param planeId
	 * @return
	 */
	public Plane getPlaneById(String planeId) {
		for (Plane plane : planeList) {
			if (plane.getId().equals(planeId))
				return plane;
		}
		return null;
	}

	/**
	 * @return the planeList
	 */
	public List<Plane> getPlaneList() {
		return planeList;
	}

	/**
	 * 
	 * @return
	 */
	public String getProfile() {
		return gameProfile.getId();
	}

	/**
	 * 
	 * @return
	 */
	public String getRadarMapName() {
		return radarMap.getName();
	}

	/**
	 * 
	 * @return
	 */
	public List<Route> getRouteList() {
		return radarMap.getRouteList();
	}

	/**
	 * 
	 * @param runwayId
	 * @return
	 */
	public Gateway getRunwayById(String runwayId) {
		for (Gateway location : getRunwayList()) {
			if (location.getId().equals(runwayId))
				return location;
		}
		return null;
	}

	/**
	 * 
	 * @return
	 */
	public List<DefaultRunway> getRunwayList() {
		return radarMap.getRunwayList();
	}

	/**
	 * @return the safeCount
	 */
	public int getSafeCount() {
		return safeCount;
	}

	/**
	 * @return the wrongExitCount
	 */
	public int getWrongExitCount() {
		return wrongExitCount;
	}

	/**
	 * @return
	 */
	private Gateway selectRandomGateway() {
		Gateway from;
		int idx = createInt(getGatewayList().size());
		from = getGatewayList().get(idx);
		return from;
	}

	/**
	 * @param gameProfile
	 *            the gameProfile to set
	 */
	public void setGameProfile(GameProfile gameProfile) {
		this.gameProfile = gameProfile;
	}

	/**
	 * @param radarMap
	 *            the radarMap to set
	 */
	public void setRadarMap(RadarMap radarMap) {
		this.radarMap = radarMap;
	}

	/**
         * 
         * 
         */
	public void update() {
		if (iterationCount == 0)
			createNewPlane();
		updateLocations();
		updatePlaneLocations();
		checkForPlaneEntry();
		checkForCollisions();
		checkForPlaneLanding();
		checkForPlaneExits();
		++iterationCount;
	}

	/**
         * 
         * 
         */
	private void updateLocations() {
		for (Location loc : getMapLocations()) {
			loc.update();
		}
	}

	/**
         * 
         * 
         */
	private void updatePlaneLocations() {
		for (Plane plane : planeList) {
			plane.update();
		}
	}
}
