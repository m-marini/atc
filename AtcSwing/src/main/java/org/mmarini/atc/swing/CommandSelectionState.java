/**
 * 
 */
package org.mmarini.atc.swing;

import java.util.List;

import org.mmarini.atc.sim.DefaultRunway;
import org.mmarini.atc.sim.EntitySet;
import org.mmarini.atc.sim.Location;

/**
 * @author US00852
 * 
 */
public class CommandSelectionState extends CommanderStateAdapter implements
		UIAtcConstants {

	/**
	 * 
	 */
	public CommandSelectionState() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#entitiesSelected(org.mmarini
	 *      .atc.sim.EntitySet)
	 */
	@Override
	public void entitiesSelected(EntitySet set) {
		int rd = set.getRunwayDistance();
		int ld = set.getLocationDistance();
		DefaultCommandController controller = getController();
		if (rd > ld) {
			// Location selected
			List<Location> locations = set.getLocations();
			if (locations.isEmpty() || ld > THRESHOLD_DISTANCE)
				return;
			Location location = locations.get(0);
			controller.selectTurnCommand();
			controller.selectTarget(location.getId());
		} else {
			List<DefaultRunway> locations = set.getRunways();
			if (locations.isEmpty() || rd > THRESHOLD_DISTANCE)
				return;
			Location location = locations.get(0);
			controller.selectLandCommand();
			controller.selectRunway(location.getId());
		}
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#notifyCommandSelection(java
	 *      .lang.String)
	 */
	@Override
	public void notifyCommandSelection(String commandId) {
		DefaultCommandController controller = getController();
		switch (commandId) {
		case TURN_COMMAND:
			controller.selectTurnCommand();
			break;
		case LAND_COMMAND:
			controller.selectLandCommand();
			break;
		case HOLD_COMMAND:
			controller.selectHoldCommand();
			break;
		case FLIGHT_LEVEL_COMMAND:
			controller.selectFlightLevelCommand();
			break;
		default:
			controller.cancel();
			break;
		}
	}

}
