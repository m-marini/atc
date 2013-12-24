/**
 * 
 */
package org.mmarini.atc.swing;

import org.mmarini.atc.sim.EntitySet;

/**
 * @author US00852
 * 
 */
public class CommanderStateAdapter implements CommanderState {

	private DefaultCommandController controller;

	/**
	 * 
	 */
	public CommanderStateAdapter() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#cancel()
	 */
	@Override
	public void cancel() {
		controller.cancel();
	}

	/**
	 * @see org.mmarini.atc.swing.MapListener#entitiesSelected(org.mmarini.atc.sim
	 *      .EntitySet)
	 */
	@Override
	public void entitiesSelected(EntitySet set) {
	}

	/**
	 * @return the controller
	 */
	protected DefaultCommandController getController() {
		return controller;
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyCommandSelection(java.lang
	 *      .String)
	 */
	@Override
	public void notifyCommandSelection(String commandId) {
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyFlightLevelSelection(java
	 *      .lang.String)
	 */
	@Override
	public void notifyFlightLevelSelection(String flightLevel) {
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyLocationSelection(java.
	 *      lang.String)
	 */
	@Override
	public void notifyLocationSelection(String locationId) {
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyPlaneSelection(java.lang
	 *      .String)
	 */
	@Override
	public void notifyPlaneSelection(String planeId) {
	}

	/**
	 * @param controller
	 *            the controller to set
	 */
	public void setController(DefaultCommandController controller) {
		this.controller = controller;
	}

}
