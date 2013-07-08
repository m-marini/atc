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
import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.JTextField;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.ChangeFlightLevelMessage;
import org.mmarini.atc.sim.ClearToLandMessage;
import org.mmarini.atc.sim.HoldMessage;
import org.mmarini.atc.sim.Message;
import org.mmarini.atc.sim.MessageVisitor;
import org.mmarini.atc.sim.MessageVisitorAdapter;
import org.mmarini.atc.sim.TurnToMessage;
import org.mmarini.atc.sound.Player;

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
	private String planeId;
	private String flightLevelId;
	private String locationId;
	private AtcHandler atcHandler;
	private JTextField info;
	private Message message;
	private JPanel panel;
	private Player player;
	private GameListener gameListener;
	private Action endAction;
	private MessageVisitor messageVisitor;

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

		messageVisitor = new MessageVisitorAdapter() {
			/**
	         * 
	         */
			@Override
			public void visit(ChangeFlightLevelMessage message) {
				String id = flightLevelId;
				message.setFlightLevelId(id);
				player.spell(id);
				sendMessage();
				cancel();
			}

			/**
	         * 
	         */
			@Override
			public void visit(ClearToLandMessage message) {
				String id = locationId;
				message.setLocationId(id);
				player.spell(id);
				sendMessage();
				cancel();
			}

			/**
	         * 
	         */
			@Override
			public void visit(HoldMessage message) {
				String id = locationId;
				message.setConditionId(id);
				if (id != null) {
					player.playSample(Player.AT);
					player.spell(id);
				}
				sendMessage();
				cancel();
			}

			/**
	         * 
	         */
			@Override
			public void visit(TurnToMessage message) {
				String id = locationId;
				if (message.getLocationId() == null) {
					message.setLocationId(id);
					String text = MessageFormat.format(
							"{0} turn to {1}",
							new Object[] { message.getPlaneId(),
									message.getLocationId() });
					showInfo(text);
					player.spell(id);
					showPane(CONDITION_PANE);
				} else {
					message.setConditionId(id);
					if (id != null) {
						player.playSample(Player.AT);
						player.spell(id);
					}
					sendMessage();
					cancel();
				}
			}
		};
		init();
	}

	/**
         * 
         */
	@Override
	public void cancel() {
		showInfo("");
		showPane(PLANE_PANE);
	}

	/**
         * 
         * 
         */
	private void init() {
		commandPane.setCommandController(this);
		flightLevelPane.setCommandController(this);
		runwayPane.setCommandController(this);
		conditionPane.setCommandController(this);
		locationPane.setCommandController(this);

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

		Action action = endAction;
		action.putValue(Action.NAME, "");
		Icon icon = new ImageIcon(getClass().getResource(EXIT_IMAGE));
		action.putValue(Action.SMALL_ICON, icon);
		JButton button = new AtcButton();
		button.setAction(action);
		add(button, BorderLayout.SOUTH);
	}

	/**
         * 
         */
	@Override
	public void notifyCommandSelection(String commandId) {
		String id = planeId;
		if (TURN_COMMAND.equals(commandId)) {
			TurnToMessage message = new TurnToMessage();
			message.setPlaneId(id);
			this.message = message;
			showInfo(id + " turn to");
			player.playSample(Player.TURN_HEADING_TO);
			showPane(LOCATION_PANE);
		} else if (LAND_COMMAND.equals(commandId)) {
			ClearToLandMessage message = new ClearToLandMessage();
			message.setPlaneId(id);
			this.message = message;
			showInfo(id + " clear to land");
			player.playSample(Player.CLEAR_TO_LAND);
			showPane(RUNWAY_PANE);
		} else if (HOLD_COMMAND.equals(commandId)) {
			HoldMessage message = new HoldMessage();
			message.setPlaneId(id);
			this.message = message;
			showInfo(id + " hold in circle");
			player.playSample(Player.HOLD_ON);
			showPane(CONDITION_PANE);
		} else if (FLIGHT_LEVEL_COMMAND.equals(commandId)) {
			ChangeFlightLevelMessage message = new ChangeFlightLevelMessage();
			message.setPlaneId(id);
			this.message = message;
			showInfo(id + " flight level");
			player.playSample(Player.CHANGE_FLIGHT_LEVEL);
			showPane(FLIGHT_LEVEL_PANE);
		} else {
			cancel();
		}
	}

	/**
         * 
         */
	@Override
	public void notifyFlightLevelSelection(String flightLevel) {
		this.flightLevelId = flightLevel;
		message.apply(messageVisitor);
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyLocationSelection(java.
	 *      lang.String)
	 */
	@Override
	public void notifyLocationSelection(String locationId) {
		this.locationId = locationId;
		message.apply(messageVisitor);
	}

	/**
	 * @see org.mmarini.atc.swing.CommandController#notifyPlaneSelection(java.lang
	 *      .String)
	 */
	@Override
	public void notifyPlaneSelection(String planeId) {
		this.planeId = planeId;
		showInfo(planeId);
		player.spell(planeId);
		showPane(COMMAND_PANE);
	}

	/**
	 * 
	 */
	public void refresh() {
		planeButtonPane.refresh();
		runwayPane.refresh();
		conditionPane.refresh();
	}

	/**
	 * 
	 */
	private void sendMessage() {
		atcHandler.consume(message);
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
	}

	/**
	 * @param gameListener
	 *            the gameListener to set
	 */
	public void setGameListener(GameListener gameListener) {
		this.gameListener = gameListener;
	}

	/**
	 * 
	 * @param text
	 */
	private void showInfo(String text) {
		info.setText(text);
	}

	/**
	 * 
	 * @param paneId
	 */
	private void showPane(String paneId) {
		cardLayout.show(panel, paneId);
	}
}
