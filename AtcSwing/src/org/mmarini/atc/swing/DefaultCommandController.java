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
import java.io.IOException;
import java.net.URL;
import java.text.MessageFormat;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.BorderFactory;
import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.JTextField;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.ChangeFlightLevelMessage;
import org.mmarini.atc.sim.ClearToLandMessage;
import org.mmarini.atc.sim.HoldMessage;
import org.mmarini.atc.sim.Message;
import org.mmarini.atc.sim.MessageVisitor;
import org.mmarini.atc.sim.MessageVisitorAdapter;
import org.mmarini.atc.sim.TurnToMessage;
import org.mmarini.atc.sound.Player;
import org.springframework.core.io.Resource;

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

	private static Log log = LogFactory.getLog(DefaultCommandController.class);

	private PlaneButtonPane planeButtonPane;

	private FlightLevelPane flightLevelPane;

	private CommandPane commandPane;

	private AbstractCommandPane locationPane;

	private RunwayPane runwayPane;

	private ConditionPane conditionPane;

	private CardLayout cardLayout = new CardLayout();

	private String planeId;

	private String flightLevelId;

	private String locationId;

	private AtcHandler atcHandler;

	private JTextField info = new JTextField();

	private Message message;

	private JPanel panel = new JPanel();

	private Player player;

	private GameListener gameListener;

	private Resource endGameIconResource;

	private Action endAction = new AbstractAction() {

		/**
         * 
         */
		private static final long serialVersionUID = 1L;

		@Override
		public void actionPerformed(ActionEvent e) {
			GameListener list = getGameListener();
			if (list != null)
				list.endGame();
		}

	};

	private MessageVisitor messageVisitor = new MessageVisitorAdapter() {
		/**
         * 
         */
		@Override
		public void visit(ChangeFlightLevelMessage message) {
			String id = getFlightLevelId();
			message.setFlightLevelId(id);
			getPlayer().spell(id);
			sendMessage();
			cancel();
		}

		/**
         * 
         */
		@Override
		public void visit(ClearToLandMessage message) {
			String id = getLocationId();
			message.setLocationId(id);
			getPlayer().spell(id);
			sendMessage();
			cancel();
		}

		/**
         * 
         */
		@Override
		public void visit(HoldMessage message) {
			String id = getLocationId();
			message.setConditionId(id);
			if (id != null) {
				Player player = getPlayer();
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
			String id = getLocationId();
			Player player = getPlayer();
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

	/**
         * 
         */
	@Override
	public void cancel() {
		showInfo("");
		showPane(PLANE_PANE);
	}

	/**
	 * @return the atcHandler
	 */
	private AtcHandler getAtcHandler() {
		return atcHandler;
	}

	/**
	 * @return the cardLayout
	 */
	private CardLayout getCardLayout() {
		return cardLayout;
	}

	/**
	 * @return the commandPane
	 */
	private CommandPane getCommandPane() {
		return commandPane;
	}

	/**
	 * @return the conditionPane
	 */
	private ConditionPane getConditionPane() {
		return conditionPane;
	}

	/**
	 * @return the endAction
	 */
	private Action getEndAction() {
		return endAction;
	}

	/**
	 * @return the endGameIconResource
	 */
	private Resource getEndGameIconResource() {
		return endGameIconResource;
	}

	/**
	 * @return the flightLevelId
	 */
	private String getFlightLevelId() {
		return flightLevelId;
	}

	/**
	 * @return the flightLevelPane
	 */
	private FlightLevelPane getFlightLevelPane() {
		return flightLevelPane;
	}

	/**
	 * @return the gameListener
	 */
	private GameListener getGameListener() {
		return gameListener;
	}

	/**
	 * @return the info
	 */
	private JTextField getInfo() {
		return info;
	}

	/**
	 * @return the locationId
	 */
	private String getLocationId() {
		return locationId;
	}

	/**
	 * @return the locationPane
	 */
	private AbstractCommandPane getLocationPane() {
		return locationPane;
	}

	/**
	 * @return the message
	 */
	private Message getMessage() {
		return message;
	}

	/**
	 * @return the messageVisitor
	 */
	private MessageVisitor getMessageVisitor() {
		return messageVisitor;
	}

	/**
	 * @return the panel
	 */
	private JPanel getPanel() {
		return panel;
	}

	/**
	 * @return the planeButtonPane
	 */
	private PlaneButtonPane getPlaneButtonPane() {
		return planeButtonPane;
	}

	/**
	 * @return the planeId
	 */
	private String getPlaneId() {
		return planeId;
	}

	/**
	 * @return the player
	 */
	private Player getPlayer() {
		return player;
	}

	/**
	 * @return the runwayPane
	 */
	private RunwayPane getRunwayPane() {
		return runwayPane;
	}

	/**
         * 
         * 
         */
	public void init() {
		setPreferredSize(PREFERRED_SIZE);
		JPanel panel = getPanel();
		panel.setLayout(getCardLayout());
		panel.add(getPlaneButtonPane(), PLANE_PANE);
		panel.add(getCommandPane(), COMMAND_PANE);
		panel.add(getLocationPane(), LOCATION_PANE);
		panel.add(getFlightLevelPane(), FLIGHT_LEVEL_PANE);
		panel.add(getRunwayPane(), RUNWAY_PANE);
		panel.add(getConditionPane(), CONDITION_PANE);
		setLayout(new BorderLayout());
		add(getPanel(), BorderLayout.CENTER);
		JTextField info = getInfo();
		info.setEditable(false);
		info.setBackground(Color.BLACK);
		info.setForeground(Color.GREEN);
		info.setFont(getFont().deriveFont(Font.BOLD));
		info.setBorder(BorderFactory.createLineBorder(Color.GREEN));
		add(info, BorderLayout.NORTH);

		Action action = getEndAction();
		action.putValue(Action.NAME, "");
		Resource resource = getEndGameIconResource();
		if (resource != null) {
			try {
				URL url = resource.getURL();
				if (url != null) {
					Icon icon = new ImageIcon(url);
					if (icon != null) {
						action.putValue(Action.SMALL_ICON, icon);
					}
				}
			} catch (IOException e) {
				log.error(e.getMessage(), e);
			}
		}
		JButton button = new AtcButton();
		button.setAction(action);
		add(button, BorderLayout.SOUTH);
	}

	/**
         * 
         */
	@Override
	public void notifyCommandSelection(String commandId) {
		String id = getPlaneId();
		if (TURN_COMMAND.equals(commandId)) {
			TurnToMessage message = new TurnToMessage();
			message.setPlaneId(id);
			setMessage(message);
			showInfo(id + " turn to");
			getPlayer().playSample(Player.TURN_HEADING_TO);
			showPane(LOCATION_PANE);
		} else if (LAND_COMMAND.equals(commandId)) {
			ClearToLandMessage message = new ClearToLandMessage();
			message.setPlaneId(id);
			setMessage(message);
			showInfo(id + " clear to land");
			getPlayer().playSample(Player.CLEAR_TO_LAND);
			showPane(RUNWAY_PANE);
		} else if (HOLD_COMMAND.equals(commandId)) {
			HoldMessage message = new HoldMessage();
			message.setPlaneId(id);
			setMessage(message);
			showInfo(id + " hold in circle");
			getPlayer().playSample(Player.HOLD_ON);
			showPane(CONDITION_PANE);
		} else if (FLIGHT_LEVEL_COMMAND.equals(commandId)) {
			ChangeFlightLevelMessage message = new ChangeFlightLevelMessage();
			message.setPlaneId(id);
			setMessage(message);
			showInfo(id + " flight level");
			getPlayer().playSample(Player.CHANGE_FLIGHT_LEVEL);
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
		setFlightLevelId(flightLevel);
		getMessage().apply(getMessageVisitor());
	}

	/**
         * 
         */
	@Override
	public void notifyLocationSelection(String locationId) {
		setLocationId(locationId);
		getMessage().apply(getMessageVisitor());
	}

	/**
         * 
         */
	@Override
	public void notifyPlaneSelection(String planeId) {
		setPlaneId(planeId);
		showInfo(planeId);
		getPlayer().spell(planeId);
		showPane(COMMAND_PANE);
	}

	/**
         * 
         * 
         */
	private void sendMessage() {
		Message msg = getMessage();
		getAtcHandler().consume(msg);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param commandPane
	 *            the commandPane to set
	 */
	public void setCommandPane(CommandPane commandPane) {
		this.commandPane = commandPane;
	}

	/**
	 * @param conditionPane
	 *            the conditionPane to set
	 */
	public void setConditionPane(ConditionPane conditionPane) {
		this.conditionPane = conditionPane;
	}

	/**
	 * @param endGameIconResource
	 *            the endGameIconResource to set
	 */
	public void setEndGameIconResource(Resource endGameIconResource) {
		this.endGameIconResource = endGameIconResource;
	}

	/**
	 * @param flightLevelId
	 *            the flightLevelId to set
	 */
	private void setFlightLevelId(String flightLevelId) {
		this.flightLevelId = flightLevelId;
	}

	/**
	 * @param flightLevelPane
	 *            the flightLevelPane to set
	 */
	public void setFlightLevelPane(FlightLevelPane flightLevelPane) {
		this.flightLevelPane = flightLevelPane;
	}

	/**
	 * @param gameListener
	 *            the gameListener to set
	 */
	public void setGameListener(GameListener gameListener) {
		this.gameListener = gameListener;
	}

	/**
	 * @param locationId
	 *            the locationId to set
	 */
	private void setLocationId(String locationId) {
		this.locationId = locationId;
	}

	/**
	 * @param locationPane
	 *            the locationPane to set
	 */
	public void setLocationPane(AbstractCommandPane locationPane) {
		this.locationPane = locationPane;
	}

	/**
	 * @param message
	 *            the message to set
	 */
	private void setMessage(Message message) {
		this.message = message;
	}

	/**
	 * @param planeButtonPane
	 *            the planeButtonPane to set
	 */
	public void setPlaneButtonPane(PlaneButtonPane planeButtonPane) {
		this.planeButtonPane = planeButtonPane;
	}

	/**
	 * @param planeId
	 *            the planeId to set
	 */
	private void setPlaneId(String planeId) {
		this.planeId = planeId;
	}

	/**
	 * @param player
	 *            the player to set
	 */
	public void setPlayer(Player player) {
		this.player = player;
	}

	/**
	 * @param runwayPane
	 *            the runwayPane to set
	 */
	public void setRunwayPane(RunwayPane runwayPane) {
		this.runwayPane = runwayPane;
	}

	/**
	 * 
	 * @param text
	 */
	private void showInfo(String text) {
		getInfo().setText(text);
	}

	/**
	 * 
	 * @param paneId
	 */
	private void showPane(String paneId) {
		getCardLayout().show(getPanel(), paneId);
	}
}
