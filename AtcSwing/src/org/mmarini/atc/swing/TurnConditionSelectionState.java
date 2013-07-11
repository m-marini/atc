/**
 * 
 */
package org.mmarini.atc.swing;

import java.util.List;

import org.mmarini.atc.sim.EntitySet;
import org.mmarini.atc.sim.Location;

/**
 * @author US00852
 * 
 */
public class TurnConditionSelectionState extends CommanderStateAdapter
		implements UIAtcConstants {

	/**
	 * 
	 */
	public TurnConditionSelectionState() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#entitiesSelected(org.mmarini
	 *      .atc.sim.EntitySet)
	 */
	@Override
	public void entitiesSelected(EntitySet set) {
		if (set.getLocationDistance() > THRESHOLD_DISTANCE)
			return;
		List<Location> locations = set.getLocations();
		if (locations.isEmpty())
			return;
		Location location = locations.get(0);
		getController().selectTurnCondition(location.getId());
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#notifyLocationSelection(java
	 *      .lang.String)
	 */
	@Override
	public void notifyLocationSelection(String locationId) {
		getController().selectTurnCondition(locationId);
	}

}
