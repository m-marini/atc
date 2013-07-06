/*
 * MenuPane.java
 *
 * $Id: MenuPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 *
 * 12/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.util.Iterator;
import java.util.List;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.BorderFactory;
import javax.swing.ButtonGroup;
import javax.swing.ButtonModel;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.JRadioButton;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.RadarMap;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: MenuPane.java,v 1.3 2008/03/01 21:20:05 marco Exp $
 * 
 */
public class MenuPane extends JPanel {

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private static Log log = LogFactory.getLog(MenuPane.class);

	private MenuPaneListener menuPaneListener;
	private HitsPane hitsPane;
	private AtcHandler atcHandler;
	private ButtonGroup levelGroup;
	private ButtonGroup mapGroup;
	private Action newAction;
	private Action helpAction;
	private Action exitAction;

	/**
	 * 
	 */
	public MenuPane() {
		levelGroup = new ButtonGroup();
		mapGroup = new ButtonGroup();
		hitsPane = new HitsPane();

		newAction = new AbstractAction() {

			/**
	         * 
	         */
			private static final long serialVersionUID = 1L;

			@Override
			public void actionPerformed(ActionEvent arg0) {
				if (menuPaneListener != null)
					menuPaneListener.startNewGame(getSelectedMap(),
							getSelectedLevel());
			}

		};

		helpAction = new AbstractAction() {

			/**
	         * 
	         */
			private static final long serialVersionUID = 1L;

			@Override
			public void actionPerformed(ActionEvent arg0) {
				if (menuPaneListener != null)
					menuPaneListener.openHelp();
			}
		};

		exitAction = new AbstractAction() {

			/**
	         * 
	         */
			private static final long serialVersionUID = 1L;

			@Override
			public void actionPerformed(ActionEvent arg0) {
				if (menuPaneListener != null)
					menuPaneListener.exitGame();
			}

		};
	}

	/**
	 * @return
	 */
	private JPanel createButtonPane() {
		JPanel buttonPane = new JPanel();
		buttonPane.setLayout(new GridLayout(3, 1));

		newAction.putValue(Action.NAME, "New Game");
		buttonPane.add(new JButton(newAction));

		helpAction.putValue(Action.NAME, "Help");
		buttonPane.add(new JButton(helpAction));

		exitAction.putValue(Action.NAME, "Exit");
		buttonPane.add(new JButton(exitAction));
		return buttonPane;
	}

	/**
	 * @return
	 */
	private JPanel createLevelPane() {
		JPanel freqPane = new JPanel();
		freqPane.setBorder(BorderFactory.createTitledBorder("Game level"));
		GridBagLayout gbl = new GridBagLayout();
		freqPane.setLayout(gbl);
		GridBagConstraints gbc = new GridBagConstraints();
		gbc.gridx = 0;
		gbc.gridy = 0;
		gbc.insets = new Insets(1, 1, 1, 1);
		gbc.anchor = GridBagConstraints.WEST;

		ButtonGroup group = levelGroup;

		JRadioButton btn = createRadioButton("Training", "training", group);
		btn.setSelected(true);
		gbl.setConstraints(btn, gbc);
		++gbc.gridy;
		freqPane.add(btn);

		btn = createRadioButton("Easy", "easy", group);
		gbl.setConstraints(btn, gbc);
		++gbc.gridy;
		freqPane.add(btn);

		btn = createRadioButton("Medium", "medium", group);
		gbl.setConstraints(btn, gbc);
		++gbc.gridy;
		freqPane.add(btn);

		btn = createRadioButton("Difficult", "difficult", group);
		gbl.setConstraints(btn, gbc);
		++gbc.gridy;
		freqPane.add(btn);

		btn = createRadioButton("Hard", "hard", group);
		gbl.setConstraints(btn, gbc);
		++gbc.gridy;
		freqPane.add(btn);

		JPanel cmp = new JPanel();
		gbc.weighty = 1;
		gbl.setConstraints(cmp, gbc);
		freqPane.add(cmp);

		return freqPane;
	}

	/**
	 * @return
	 */
	private JPanel createMapPane() {
		JPanel mapPane = new JPanel();
		mapPane.setBorder(BorderFactory.createTitledBorder("Map list"));

		GridBagLayout gbl = new GridBagLayout();
		mapPane.setLayout(gbl);
		GridBagConstraints gbc = new GridBagConstraints();
		gbc.gridx = 0;
		gbc.gridy = 0;
		gbc.insets = new Insets(1, 1, 1, 1);
		gbc.anchor = GridBagConstraints.WEST;

		ButtonGroup group = mapGroup;
		List<RadarMap> list = atcHandler.retrieveRadarMap();

		boolean next = false;
		for (Iterator<RadarMap> i = list.iterator(); i.hasNext();) {
			RadarMap map = i.next();
			JRadioButton btn = createRadioButton(map.getName(), map.getId(),
					group);
			gbl.setConstraints(btn, gbc);
			++gbc.gridy;
			mapPane.add(btn);
			if (!next) {
				next = true;
				btn.setSelected(true);
			}
		}

		JPanel cmp = new JPanel();
		gbc.weighty = 1;
		gbl.setConstraints(cmp, gbc);
		mapPane.add(cmp);

		return mapPane;
	}

	/**
	 * @return
	 */
	private JPanel createOptPane() {
		JPanel optPane = new JPanel();
		optPane.setLayout(new GridLayout(1, 2));

		JPanel freqPane = createLevelPane();
		optPane.add(freqPane);

		JPanel mapPane = createMapPane();
		optPane.add(mapPane);

		return optPane;
	}

	/**
	 * 
	 * @param text
	 * @param value
	 * @param group
	 * @return
	 */
	private JRadioButton createRadioButton(String text, Object value,
			ButtonGroup group) {
		JRadioButton btn = new JRadioButton(text);
		btn.setModel(new ObjectButtonModel(value));
		group.add(btn);
		return btn;
	}

	/**
	 * 
	 * @return
	 */
	private String getSelectedLevel() {
		ButtonGroup group = levelGroup;
		ButtonModel btn = group.getSelection();
		Object[] aa = btn.getSelectedObjects();
		return (String) aa[0];
	}

	/**
	 * 
	 * @return
	 */
	private String getSelectedMap() {
		return (String) mapGroup.getSelection().getSelectedObjects()[0];
	}

	/**
         * 
         * 
         */
	private void init() {
		log.debug("init");

		GridBagConstraints gbc = new GridBagConstraints();
		gbc.insets = new Insets(1, 1, 1, 1);
		gbc.gridx = 0;
		gbc.gridy = 0;

		GridBagLayout gbl = new GridBagLayout();
		setLayout(gbl);

		gbl.setConstraints(hitsPane, gbc);
		add(hitsPane);

		JPanel optPane = createOptPane();
		++gbc.gridx;
		gbl.setConstraints(optPane, gbc);
		add(optPane);

		JPanel buttonPane = createButtonPane();
		++gbc.gridx;
		gbl.setConstraints(buttonPane, gbc);
		add(buttonPane);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
		hitsPane.setAtcHandler(atcHandler);
		init();
	}

	/**
	 * @param menuPaneListener
	 *            the menuPaneListener to set
	 */
	public void setMenuPaneListener(MenuPaneListener menuPaneListener) {
		this.menuPaneListener = menuPaneListener;
	}
}
