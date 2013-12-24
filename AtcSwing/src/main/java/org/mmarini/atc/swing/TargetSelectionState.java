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
public class TargetSelectionState extends CommanderStateAdapter implements
		UIAtcConstants {

	/**
	 * 
	 */
	public TargetSelectionState() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#entitiesSelected(org.mmarini
	 *      .atc.sim.EntitySet)
	 */
	@Override
	public void entitiesSelected(EntitySet set) {
		int ld = set.getLocationDistance();
		if (ld > THRESHOLD_DISTANCE)
			return;
		// Location selected
		List<Location> locations = set.getLocations();
		if (locations.isEmpty())
			return;
		Location location = locations.get(0);
		getController().selectTarget(location.getId());
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#notifyLocationSelection(java
	 *      .lang.String)
	 */
	@Override
	public void notifyLocationSelection(String locationId) {
		getController().selectTarget(locationId);
	}

}
