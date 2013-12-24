/**
 * 
 */
package org.mmarini.atc.swing;

import java.util.List;

import org.mmarini.atc.sim.EntitySet;
import org.mmarini.atc.sim.Plane;

/**
 * @author US00852
 * 
 */
public class PlaneSelectionState extends CommanderStateAdapter {

	/**
	 * 
	 */
	public PlaneSelectionState() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#entitiesSelected(org.mmarini
	 *      .atc.sim.EntitySet)
	 */
	@Override
	public void entitiesSelected(EntitySet set) {
		List<Plane> planes = set.getPlanes();
		if (set.getPlanesDistance() < 10 && !planes.isEmpty()) {
			notifyPlaneSelection(planes.get(0).getId());
		}
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#notifyPlaneSelection(java
	 *      .lang.String)
	 */
	@Override
	public void notifyPlaneSelection(String planeId) {
		getController().selectPlane(planeId);
	}

}
