/**
 * 
 */
package org.mmarini.atc.swing;

import java.util.List;

import org.mmarini.atc.sim.DefaultRunway;
import org.mmarini.atc.sim.EntitySet;

/**
 * @author US00852
 * 
 */
public class RunwaySelectionState extends CommanderStateAdapter implements
		UIAtcConstants {

	/**
	 * 
	 */
	public RunwaySelectionState() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#entitiesSelected(org.mmarini
	 *      .atc.sim.EntitySet)
	 */
	@Override
	public void entitiesSelected(EntitySet set) {
		if (set.getRunwayDistance() > THRESHOLD_DISTANCE)
			return;
		List<DefaultRunway> runways = set.getRunways();
		if (runways.isEmpty())
			return;
		DefaultRunway runway = runways.get(0);
		getController().selectRunway(runway.getId());
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#notifyLocationSelection(java
	 *      .lang.String)
	 */
	@Override
	public void notifyLocationSelection(String locationId) {
		getController().selectRunway(locationId);
	}

}
