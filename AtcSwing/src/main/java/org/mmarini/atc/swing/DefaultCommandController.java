/*
 * DefaultCommandController.java
 *
 * $Id: DefaultCommandController.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.CardLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.text.MessageFormat;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.JTextField;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.ChangeFlightLevelMessage;
import org.mmarini.atc.sim.ClearToLandMessage;
import org.mmarini.atc.sim.EntitySet;
import org.mmarini.atc.sim.HoldMessage;
import org.mmarini.atc.sim.TurnToMessage;
import org.mmarini.atc.sound.Player;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: DefaultCommandController.java,v 1.1.2.1 2008/01/06 18:29:52
 *          marco Exp $
 * 
 */
public class DefaultCommandController extends JPanel implements
		CommandController, UIAtcConstants {
	public static final String CONDITION_PANE = "CONDITION_PANE";
	public static final String LOCATION_PANE = "LOCATION_PANE";
	public static final String FLIGHT_LEVEL_PANE = "FLIGHT_LEVEL_PANE";
	public static final String RUNWAY_PANE = "RUNWAY_PANE";
	public static final String COMMAND_PANE = "COMMAND_PANE";
	public static final String PLANE_PANE = "PLANE_PANE";
	public static final Dimension PREFERRED_SIZE = new Dimension(180, 400);
	private static Logger log = LoggerFactory
			.getLogger(DefaultCommandController.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private PlaneButtonPane planeButtonPane;
	private FlightLevelPane flightLevelPane;
	private CommandPane commandPane;
	private LocationPane locationPane;
	private RunwayPane runwayPane;
	private ConditionPane conditionPane;
	private CardLayout cardLayout;
	private AtcHandler atcHandler;
	private JTextField info;
	private JPanel panel;
	private Player player;
	private GameListener gameListener;
	private Action endAction;

	private CommanderState currentState;
	private PlaneSelectionState planeSelectionState;
	private CommandSelectionState commandSelectionState;
	private TargetSelectionState targetSelectionState;
	private RunwaySelectionState runwaySelectionState;
	private FlightLevelSelectionState flightLevelSelectionState;
	private HoldConditionSelectionState holdConditionSelectionState;
	private TurnConditionSelectionState turnConditionSelectionState;

	private String planeId;
	private String targetId;

	/**
	 * 
	 */
	public DefaultCommandController() {
		cardLayout = new CardLayout();
		info = new JTextField();
		panel = new JPanel();
		planeButtonPane = new PlaneButtonPane();
		commandPane = new CommandPane();
		flightLevelPane = new FlightLevelPane();
		runwayPane = new RunwayPane();
		conditionPane = new ConditionPane();
		locationPane = new LocationPane();
		player = Player.getInstance();
		planeSelectionState = new PlaneSelectionState();
		commandSelectionState = new CommandSelectionState();
		flightLevelSelectionState = new FlightLevelSelectionState();
		targetSelectionState = new TargetSelectionState();
		holdConditionSelectionState = new HoldConditionSelectionState();
		turnConditionSelectionState = new TurnConditionSelectionState();
		runwaySelectionState = new RunwaySelectionState();

		endAction = new AbstractAction() {

			/**
	         * 
	         */
			private static final long serialVersionUID = 1L;

			@Override
			public void actionPerformed(ActionEvent e) {
				if (gameListener != null)
					gameListener.endGame();
			}

		};

		buildStateFlow();
		createContent();
		log.debug("DefaultCommandController created.");
	}

	/**
	 * 
	 */
	private void buildStateFlow() {
		planeSelectionState.setController(this);
		commandSelectionState.setController(this);
		flightLevelSelectionState.setController(this);
		targetSelectionState.setController(this);
		holdConditionSelectionState.setController(this);
		turnConditionSelectionState.setController(this);
		runwaySelectionState.setController(this);

		currentState = planeSelectionState;
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#cancel()
	 */
	@Override
	public void cancel() {
		info.setText("");
		planeButtonPane.refresh();
		cardLayout.show(panel, PLANE_PANE);
		currentState = planeSelectionState;
	}

	/**
         * 
         * 
         */
	private void createContent() {
		commandPane.setCommandController(this);
		flightLevelPane.setCommandController(this);
		runwayPane.setCommandController(this);
		conditionPane.setCommandController(this);
		locationPane.setCommandController(this);
		planeButtonPane.setCommandController(this);

		setPreferredSize(PREFERRED_SIZE);
		panel.setLayout(cardLayout);
		panel.add(planeButtonPane, PLANE_PANE);
		panel.add(commandPane, COMMAND_PANE);
		panel.add(locationPane, LOCATION_PANE);
		panel.add(flightLevelPane, FLIGHT_LEVEL_PANE);
		panel.add(runwayPane, RUNWAY_PANE);
		panel.add(conditionPane, CONDITION_PANE);
		setLayout(new BorderLayout());
		add(panel, BorderLayout.CENTER);

		info.setEditable(false);
		info.setBackground(Color.BLACK);
		info.setForeground(Color.GREEN);
		info.setFont(getFont().deriveFont(Font.BOLD));
		info.setBorder(BorderFactory.createLineBorder(Color.GREEN));
		add(info, BorderLayout.NORTH);

		endAction.putValue(Action.NAME, "");
		endAction.putValue(Action.SMALL_ICON, IconFactory.getInstance()
				.createIcon(EXIT_IMAGE));
		JButton button = new AtcButton();
		button.setAction(endAction);
		add(button, BorderLayout.SOUTH);
	}

	/**
	 * 
	 */
	public void init() {
		planeButtonPane.refresh();
		runwayPane.init();
		conditionPane.init();
		locationPane.init();
		cancel();
	}

	/**
	 * 
	 * @param set
	 */
	public void manageEntitiesSelection(EntitySet set) {
		currentState.entitiesSelected(set);
	}

	/**
         * 
         */
	@Override
	public void notifyCommandSelection(String commandId) {
		currentState.notifyCommandSelection(commandId);
	}

	/**
         * 
         */
	@Override
	public void notifyFlightLevelSelection(String flightLevel) {
		currentState.notifyFlightLevelSelection(flightLevel);
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyLocationSelection(java.
	 *      lang.String)
	 */
	@Override
	public void notifyLocationSelection(String locationId) {
		currentState.notifyLocationSelection(locationId);
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyPlaneSelection(java.lang
	 *      .String)
	 */
	@Override
	public void notifyPlaneSelection(String planeId) {
		currentState.notifyPlaneSelection(planeId);
	}

	/**
	 * 
	 */
	public void refresh() {
		planeButtonPane.refresh();
	}

	/**
	 * 
	 * @param flightLevel
	 */
	public void selectFlightLevel(String flightLevel) {
		ChangeFlightLevelMessage message = new ChangeFlightLevelMessage();
		message.setPlaneId(planeId);
		message.setFlightLevelId(flightLevel);
		player.spell(flightLevel);
		atcHandler.consume(message);
		cancel();
	}

	/**
	 * 
	 */
	public void selectFlightLevelCommand() {
		info.setText(planeId + " flight level");
		player.playSample(Player.CHANGE_FLIGHT_LEVEL);
		cardLayout.show(panel, FLIGHT_LEVEL_PANE);
		currentState = flightLevelSelectionState;
	}

	/**
	 * 
	 */
	public void selectHoldCommand() {
		info.setText(planeId + " hold in circle");
		player.playSample(Player.HOLD_ON);
		cardLayout.show(panel, CONDITION_PANE);
		currentState = holdConditionSelectionState;
	}

	/**
	 * 
	 * @param id
	 */
	public void selectHoldCondition(String id) {
		HoldMessage message = new HoldMessage();
		message.setPlaneId(planeId);
		if (id != null) {
			player.playSample(Player.AT);
			player.spell(id);
			message.setConditionId(id);
		}
		atcHandler.consume(message);
		cancel();
	}

	/**
	 * 
	 */
	public void selectLandCommand() {
		info.setText(planeId + " clear to land");
		player.playSample(Player.CLEAR_TO_LAND);
		cardLayout.show(panel, RUNWAY_PANE);
		currentState = runwaySelectionState;
	}

	/**
	 * 
	 * @param planeId
	 */
	public void selectPlane(String planeId) {
		this.planeId = planeId;
		info.setText(planeId);
		player.spell(planeId);
		cardLayout.show(panel, COMMAND_PANE);
		currentState = commandSelectionState;
	}

	/**
	 * 
	 * @param id
	 */
	public void selectRunway(String id) {
		ClearToLandMessage message = new ClearToLandMessage();
		message.setPlaneId(planeId);
		message.setLocationId(id);
		player.spell(id);
		atcHandler.consume(message);
		cancel();
	}

	/**
	 * 
	 * @param locationId2
	 */
	public void selectTarget(String locationId) {
		targetId = locationId;
		String text = MessageFormat.format("{0} turn to {1}", new Object[] {
				planeId, targetId });
		info.setText(text);
		player.spell(locationId);
		cardLayout.show(panel, CONDITION_PANE);
		currentState = turnConditionSelectionState;
	}

	/**
	 * 
	 */
	public void selectTurnCommand() {
		info.setText(planeId + " turn to");
		player.playSample(Player.TURN_HEADING_TO);
		cardLayout.show(panel, LOCATION_PANE);
		currentState = targetSelectionState;
	}

	/**
	 * 
	 * @param id
	 */
	public void selectTurnCondition(String id) {
		TurnToMessage message = new TurnToMessage();
		message.setPlaneId(planeId);
		message.setLocationId(targetId);
		if (id != null && !id.equals(targetId)) {
			player.playSample(Player.AT);
			player.spell(id);
			message.setConditionId(id);
		}
		atcHandler.consume(message);
		cancel();
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
		planeButtonPane.setAtcHandler(atcHandler);
		runwayPane.setAtcHandler(atcHandler);
		locationPane.setAtcHandler(atcHandler);
		conditionPane.setAtcHandler(atcHandler);
	}

	/**
	 * @param gameListener
	 *            the gameListener to set
	 */
	public void setGameListener(GameListener gameListener) {
		this.gameListener = gameListener;
	}
}
