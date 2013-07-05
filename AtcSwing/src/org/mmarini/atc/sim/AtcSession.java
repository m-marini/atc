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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AtcSession.java,v 1.4 2008/03/01 21:17:53 marco Exp $
 * 
 */
public class AtcSession implements MessageConsumer {
	private static Log log = LogFactory.getLog(AtcSession.class);

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
		getMessageList().add(message);
	}

	/**
         * 
         */
	private void addSafePlane() {
		setSafeCount(getSafeCount() + 1);
	}

	/**
         * 
         * 
         */
	private void checkForCollisions() {
		List<Plane> list = getPlaneList();
		int n = list.size();
		int i = 0;
		while (i < n - 1) {
			Plane plane0 = list.get(i);
			int j = i + 1;
			while (j < n) {
				Plane plane1 = list.get(j);
				if (plane0.collidesWith(plane1)) {
					log.debug("Collision between " + plane0 + " and " + plane1);
					list.remove(j);
					list.remove(i);
					--i;
					n -= 2;
					setCollisionCount(getCollisionCount() + 1);
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
		return getRandom().nextDouble() < probability;
	}

	/**
         * 
         * 
         */
	private void checkForPlaneEntry() {
		if (getPlaneList().size() < getMaxPlane()
				&& checkForEvent(getNewPlaneProbability())) {
			createNewPlane();
		}
	}

	/**
         * 
         * 
         */
	private void checkForPlaneExits() {
		for (Iterator<Plane> i = getPlaneList().iterator(); i.hasNext();) {
			Plane plane0 = i.next();
			if (plane0.isExit()) {
				if (!plane0.isCorrectExit()) {
					addMessage(new WrongExitMessage(plane0.getId()));
					setWrongExitCount(getWrongExitCount() + 1);
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
		for (Iterator<Plane> i = getPlaneList().iterator(); i.hasNext();) {
			Plane plane0 = i.next();
			if (plane0.isCrashed()) {
				addMessage(new CrashedMessage(plane0.getId()));
				i.remove();
				setCrashCount(getCrashCount() + 1);
			} else if (plane0.isLanded()) {
				if (plane0.isCorrectExit()) {
					addMessage(new LandedMessage(plane0.getId(),
							plane0.getDestinationId()));
					log.debug("Plane " + plane0 + " landed.");
					addSafePlane();
				} else {
					addMessage(new WrongRunwayMessage(plane0.getId()));
					log.debug("Plane " + plane0 + " landed at wrong runway.");
					setWrongExitCount(getWrongExitCount() + 1);
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
		PlaneMessageDispatcher dispatcher = getMessageDispatcher();
		dispatcher.setSession(this);
		dispatcher.consume(message);
	}

	/**
	 * 
	 * @param n
	 * @return
	 */
	private int createInt(int n) {
		return getRandom().nextInt(n);
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
		getPlaneList().add(plane);
		addMessage(new EnteredMessage(plane.getId(), from.getId()));
		log.debug("Plane " + plane + " entered into " + to);
	}

	/**
	 * 
	 * @return
	 */
	private Plane createPlane() {
		return getPlaneFactory().createPlane();
	}

	/**
	 * 
	 * @param consumer
	 */
	public void dequeueMessages(MessageConsumer consumer) {
		List<Message> list = getMessageList();
		if (list.isEmpty())
			return;
		for (Iterator<Message> i = list.iterator(); i.hasNext();) {
			consumer.consume(i.next());
		}
		list.clear();
	}

	/**
	 * 
	 * @return
	 */
	public List<Location> getBeaconList() {
		return getRadarMap().getBeaconList();
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
		return getRadarMap().getExitList();
	}

	/**
	 * @return the gameProfile
	 */
	private GameProfile getGameProfile() {
		return gameProfile;
	}

	/**
	 * @return the gatewayList
	 */
	private List<Gateway> getGatewayList() {
		return getRadarMap().getGatewayList();
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
		for (Iterator<Location> i = getMapLocations().iterator(); i.hasNext();) {
			Location location = i.next();
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
		return getRadarMap().getLocationList();
	}

	private int getMaxPlane() {
		return getGameProfile().getMaxPlane();
	}

	/**
	 * @return the messageDispatcher
	 */
	private PlaneMessageDispatcher getMessageDispatcher() {
		return messageDispatcher;
	}

	/**
	 * @return the messageList
	 */
	private List<Message> getMessageList() {
		return messageList;
	}

	/**
	 * 
	 * @return
	 */
	public double getNewPlaneProbability() {
		return getGameProfile().getNewPlaneProbability();
	}

	/**
	 * 
	 * @param planeId
	 * @return
	 */
	public Plane getPlaneById(String planeId) {
		List<Plane> list = getPlaneList();
		for (Iterator<Plane> i = list.iterator(); i.hasNext();) {
			Plane plane = i.next();
			if (plane.getId().equals(planeId))
				return plane;
		}
		return null;
	}

	/**
	 * @return the planeFactory
	 */
	private PlaneFactory getPlaneFactory() {
		return planeFactory;
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
		return getGameProfile().getId();
	}

	/**
	 * @return the radarMap
	 */
	private RadarMap getRadarMap() {
		return radarMap;
	}

	/**
	 * 
	 * @return
	 */
	public String getRadarMapName() {
		return getRadarMap().getName();
	}

	/**
	 * @return the random
	 */
	private Random getRandom() {
		return random;
	}

	/**
	 * 
	 * @return
	 */
	public List<Route> getRouteList() {
		return getRadarMap().getRouteList();
	}

	/**
	 * 
	 * @param runwayId
	 * @return
	 */
	public Gateway getRunwayById(String runwayId) {
		for (Iterator<Gateway> i = getRunwayList().iterator(); i.hasNext();) {
			Gateway location = i.next();
			if (location.getId().equals(runwayId))
				return location;
		}
		return null;
	}

	/**
	 * 
	 * @return
	 */
	public List<Gateway> getRunwayList() {
		return getRadarMap().getRunwayList();
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
	 * @param collisionCount
	 *            the collisionCount to set
	 */
	private void setCollisionCount(int collisionCount) {
		this.collisionCount = collisionCount;
	}

	/**
	 * @param crashCount
	 *            the crashCount to set
	 */
	private void setCrashCount(int crashCount) {
		this.crashCount = crashCount;
	}

	/**
	 * @param gameProfile
	 *            the gameProfile to set
	 */
	public void setGameProfile(GameProfile gameProfile) {
		this.gameProfile = gameProfile;
	}

	/**
	 * @param iterationCount
	 *            the iterationCount to set
	 */
	private void setIterationCount(int iterationCount) {
		this.iterationCount = iterationCount;
	}

	/**
	 * @param messageDispatcher
	 *            the messageDispatcher to set
	 */
	public void setMessageDispatcher(PlaneMessageDispatcher messageDispatcher) {
		this.messageDispatcher = messageDispatcher;
	}

	/**
	 * @param radarMap
	 *            the radarMap to set
	 */
	public void setRadarMap(RadarMap radarMap) {
		this.radarMap = radarMap;
	}

	/**
	 * @param random
	 *            the random to set
	 */
	public void setRandom(Random random) {
		this.random = random;
	}

	/**
	 * @param safeCount
	 *            the safeCount to set
	 */
	private void setSafeCount(int safeCount) {
		this.safeCount = safeCount;
	}

	/**
	 * @param wrongExitCount
	 *            the wrongExitCount to set
	 */
	private void setWrongExitCount(int wrongExits) {
		this.wrongExitCount = wrongExits;
	}

	/**
         * 
         * 
         */
	public void update() {
		if (getIterationCount() == 0)
			createNewPlane();
		updateLocations();
		updatePlaneLocations();
		checkForPlaneEntry();
		checkForCollisions();
		checkForPlaneLanding();
		checkForPlaneExits();
		setIterationCount(getIterationCount() + 1);
	}

	/**
         * 
         * 
         */
	private void updateLocations() {
		for (Iterator<Location> i = getMapLocations().iterator(); i.hasNext();) {
			Location loc = i.next();
			loc.update();
		}
	}

	/**
         * 
         * 
         */
	private void updatePlaneLocations() {
		for (Iterator<Plane> iter = getPlaneList().iterator(); iter.hasNext();) {
			Plane plane = iter.next();
			plane.update();
		}
	}
}
