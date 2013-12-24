/**
 * 
 */
package org.mmarini.atc.swing;

/**
 * @author US00852
 * 
 */
public class FlightLevelSelectionState extends CommanderStateAdapter {

	/**
	 * 
	 */
	public FlightLevelSelectionState() {
	}

	/**
	 * @see org.mmarini.atc.swing.CommanderStateAdapter#notifyFlightLevelSelection
	 *      (java.lang.String)
	 */
	@Override
	public void notifyFlightLevelSelection(String flightLevel) {
		getController().selectFlightLevel(flightLevel);
	}

}
