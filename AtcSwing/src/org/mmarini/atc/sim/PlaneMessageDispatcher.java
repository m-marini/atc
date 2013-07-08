/*
 * PlaneMessageDispatcher.java
 *
 * $Id: PlaneMessageDispatcher.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */

package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: PlaneMessageDispatcher.java,v 1.1.2.1 2008/01/07 01:17:18
 *          marco$
 */
public class PlaneMessageDispatcher extends MessageVisitorAdapter implements
		MessageConsumer, AtcConstants {
	private AtcSession session;

	/**
	 * 
	 * @param message
	 */
	@Override
	public void consume(Message message) {
		message.apply(this);
	}

	/**
	 * 
	 * @param locationId
	 * @return
	 */
	private Location retreiveLocation(String locationId) {
		Location location = session.getLocationById(locationId);
		return location;
	}

	/**
	 * 
	 * @param runwayId
	 * @return
	 */
	private Gateway retreiveRunway(String runwayId) {
		return session.getRunwayById(runwayId);
	}

	/**
	 * 
	 * @param planeId
	 * @return
	 */
	private Plane retrievePlane(String planeId) {
		Plane plane = session.getPlaneById(planeId);
		if (plane == null)
			session.addMessage(new InfoMessage(planeId + " does not exist"));
		return plane;
	}

	/**
	 * @param session
	 *            the session to set
	 */
	public void setSession(AtcSession session) {
		this.session = session;
	}

	/**
	 * 
	 * @param plane
	 * @param location
	 * @return
	 */
	private boolean verifyRoute(Plane plane, Location location) {
		if (plane.isInRoute(location.getPosition()))
			return true;
		session.addMessage(new InfoMessage(plane.getId() + " will not pass at "
				+ location.getId()));
		return false;
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.ChangeFlightLevelMessage)
	 */
	@Override
	public void visit(ChangeFlightLevelMessage message) {
		Plane plane = retrievePlane(message.getPlaneId());
		if (plane == null)
			return;
		plane.applyFlightLevel(message.getFlightLevelId());
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.ClearToLandMessage)
	 */
	@Override
	public void visit(ClearToLandMessage message) {
		String planeId = message.getPlaneId();
		Plane plane = retrievePlane(planeId);
		if (plane == null)
			return;
		String locationId = message.getLocationId();
		Gateway runway = null;
		if (locationId != null) {
			runway = retreiveRunway(locationId);
			if (runway == null || !verifyRoute(plane, runway))
				return;
		}
		if (plane.getAltitude() > MAX_LAND_ALTITUDE) {
			session.addMessage(new InfoMessage(planeId + " too high to land"));
		} else {
			plane.landTo(runway);
		}
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.HoldMessage)
	 */
	@Override
	public void visit(HoldMessage message) {
		Plane plane = retrievePlane(message.getPlaneId());
		if (plane == null)
			return;
		String locationId = message.getConditionId();
		Location location = null;
		if (locationId != null) {
			location = retreiveLocation(locationId);
			if (location == null || !verifyRoute(plane, location))
				return;
		}
		plane.applyCircle(location);
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.TurnToMessage)
	 */
	@Override
	public void visit(TurnToMessage message) {
		Plane plane = retrievePlane(message.getPlaneId());
		if (plane == null)
			return;
		String locationId = message.getLocationId();
		Location location = null;
		if (locationId != null) {
			location = retreiveLocation(locationId);
			if (location == null)
				return;
		}
		locationId = message.getConditionId();
		Location condition = null;
		if (locationId != null) {
			condition = retreiveLocation(locationId);
			if (location == null || !verifyRoute(plane, condition))
				return;
		}
		plane.applyTurnTo(location, condition);
	}
}
