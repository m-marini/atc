/*
 * EndGamePane.java
 *
 * $Id: EndGamePane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.text.MessageFormat;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;

import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.Hits;
import org.mmarini.atc.sim.HitsMemento;
import org.mmarini.atc.xml.UserOptionsPersistenceManager;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: EndGamePane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class EndGamePane extends JOptionPane implements UIAtcConstants {

	/**
	 * 
	 */
	public EndGamePane() {
		textArea = new JTextArea();
		nameField = new JTextField(10);
		okAction = new AbstractAction() {

			/**
	         * 
	         */
			private static final long serialVersionUID = 1L;

			@Override
			public void actionPerformed(ActionEvent arg0) {
				handleOk();
			}

		};
		init();
	}

	public static final String RECORD_PATTERN = "{4}.\n{5,choice,0#You does not enter in the hits, try again!|1#You enter in the hits, insert your nickname.}\n\nLevel:\t{2}\nSafe plane:\t{0}\nTime:\t{1}\nIterations:\t{3}";
	public static final String END_GAME_REASON = "Game ended because of user exit";
	public static final String WRONG_EXIT_REASON = "Game ended because of wrong exit";
	public static final String CRASH_REASON = "Game ended because of crash";
	public static final String COLLISION_REASON = "Game ended because of collision";

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private Refreshable hitsRefreshable;
	private AtcHandler atcHandler;
	private UserOptionsPersistenceManager userOptionsHandler;
	private JTextArea textArea;
	private JDialog dialog;
	private JTextField nameField;
	private Action okAction;

	/**
         * 
         * 
         */
	private void handleOk() {
		dialog.dispose();
		AtcHandler handler = atcHandler;
		handler.register(nameField.getText());
		Hits hits = handler.retrieveHits();
		if (hits.isUpdated()) {
			store(hits.createMemento());
			hitsRefreshable.refresh();
		}
	}

	/**
         * 
         * 
         */
	public void init() {
		setLayout(new BorderLayout());

		JPanel pane = new JPanel();
		pane.add(new JLabel("Name"));
		pane.add(nameField);
		add(pane, BorderLayout.NORTH);

		okAction.putValue(Action.NAME, "OK");
		add(new JButton(okAction), BorderLayout.SOUTH);

		textArea.setEditable(false);
		textArea.setRows(7);
		textArea.setFont(ATC_FONT.deriveFont(Font.BOLD));
		textArea.setBackground(Color.BLACK);
		textArea.setForeground(Color.GREEN);
		add(new JScrollPane(textArea), BorderLayout.CENTER);
	}

	/**
         * 
         * 
         */
	public void refresh() {
		String reason = END_GAME_REASON;
		AtcHandler handler = atcHandler;
		GameRecord record = handler.createRecord();
		int ct = handler.getCollisionCount();
		if (ct > 0) {
			reason = COLLISION_REASON;
		}

		ct = handler.getCrashCount();
		if (ct > 0) {
			reason = CRASH_REASON;
		}
		ct = handler.getWrongExitCount();
		if (ct > 0) {
			reason = WRONG_EXIT_REASON;
		}
		boolean better = handler.isBetter();
		int betterInt = better ? 1 : 0;
		Object[] parms = new Object[] { record.getPlaneCount(),
				record.getDate(), record.getProfile(),
				record.getIterationCount(), reason, betterInt };
		String text = MessageFormat.format(RECORD_PATTERN, parms);
		textArea.setText(text);
		nameField.setEnabled(better);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}

	/**
	 * @param dialog
	 *            the dialog to set
	 */
	private void setDialog(JDialog dialog) {
		this.dialog = dialog;
	}

	/**
	 * @param hitsRefreshable
	 *            the hitsRefreshable to set
	 */
	public void setHitsRefreshable(Refreshable hitsRefreshable) {
		this.hitsRefreshable = hitsRefreshable;
	}

	/**
	 * @param userOptionsHandler
	 *            the userOptionsHandler to set
	 */
	public void setUserOptions(UserOptionsPersistenceManager options) {
		this.userOptionsHandler = options;
	}

	/**
	 * @see java.awt.Component#show()
	 */
	public void showDialog() {
		refresh();
		JDialog dialog = createDialog(this, "End game");
		setDialog(dialog);
		dialog.setVisible(true);
	}

	/**
	 * 
	 * @param memento
	 */
	private void store(HitsMemento memento) {
		userOptionsHandler.setHits(memento);
	}
}
