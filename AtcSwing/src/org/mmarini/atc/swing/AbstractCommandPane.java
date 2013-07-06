/*
 * PlaneButtonPane.java
 *
 * $Id: AbstractCommandPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 05/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.Color;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.IOException;
import java.net.URL;

import javax.swing.BorderFactory;
import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import javax.swing.border.Border;
import javax.swing.border.TitledBorder;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.core.io.Resource;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: AbstractCommandPane.java,v 1.1.2.1 2008/01/06 18:29:52 marco
 *          Exp $
 * 
 */
public abstract class AbstractCommandPane extends JPanel {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8513765146483956118L;

	private static Log log = LogFactory.getLog(AbstractCommandPane.class);

	private CommandController commandController;
	private JButton cancelBtn;
	private Icon defaultButtonIcon;
	private Icon disabledDefaultButtonIcon;
	private Icon cancelButtonIcon;

	/**
	 * 
	 */
	protected AbstractCommandPane() {
	}

	/**
         * 
         */
	public void actionPerformed(ActionEvent event) {
		String locationId = event.getActionCommand();
		getCommandController().notifyLocationSelection(locationId);
	}

	/**
	 * @param label
	 * @return
	 */
	protected JButton createButton(String label) {
		JButton btn = new AtcButton();
		btn.setText(label);
		return btn;
	}

	/**
	 * @param label
	 * @return
	 */
	protected JButton createDefaultButton(String label) {
		JButton btn = createButton(label);
		if (defaultButtonIcon != null) {
			btn.setIcon(disabledDefaultButtonIcon);
			btn.setHorizontalTextPosition(SwingConstants.RIGHT);
		}
		if (disabledDefaultButtonIcon != null) {
			btn.setDisabledIcon(disabledDefaultButtonIcon);
		}
		return btn;
	}

	/**
	 * 
	 * @param resource
	 * @return
	 */
	protected Icon createIcon(Resource resource) {
		try {
			if (resource != null) {
				URL url = resource.getURL();
				if (url != null) {
					return new ImageIcon(url);
				}
			}
		} catch (IOException e) {
			log.error(e.getMessage(), e);
		}
		return null;
	}

	/**
	 * @return the cancelBtn
	 */
	protected JButton getCancelBtn() {
		return cancelBtn;
	}

	/**
	 * @return the commandController
	 */
	protected CommandController getCommandController() {
		return commandController;
	}

	/**
	 * 
	 * @param title
	 */
	protected void init(String title) {
		setBackground(Color.BLACK);
		setForeground(Color.GREEN);
		Border bord = BorderFactory.createEmptyBorder();
		TitledBorder border = BorderFactory.createTitledBorder(bord, title);
		border.setTitleColor(Color.GREEN);
		setBorder(border);

		JButton btn = createButton("");
		setCancelBtn(btn);
		btn.addActionListener(new ActionListener() {

			@Override
			public void actionPerformed(ActionEvent arg0) {
				getCommandController().cancel();
			}

		});
		if (cancelButtonIcon != null) {
			btn.setIcon(cancelButtonIcon);
			btn.setHorizontalTextPosition(SwingConstants.RIGHT);
		}
		setDefaultButtonIcon(defaultButtonIcon);
		setDisabledDefaultButtonIcon(disabledDefaultButtonIcon);
	}

	/**
	 * @param cancelBtn
	 *            the cancelBtn to set
	 */
	private void setCancelBtn(JButton cancelBtn) {
		this.cancelBtn = cancelBtn;
	}

	/**
	 * @param commandController
	 *            the commandController to set
	 */
	public void setCommandController(CommandController commandController) {
		this.commandController = commandController;
	}

	/**
	 * @param defaultButtonIcon
	 *            the defaultButtonIcon to set
	 */
	protected void setDefaultButtonIcon(Icon defaultButtonIcon) {
		this.defaultButtonIcon = defaultButtonIcon;
	}

	/**
	 * @param disabledDefaultButtonIcon
	 *            the disabledDefaultButtonIcon to set
	 */
	protected void setDisabledDefaultButtonIcon(Icon disabledDefaultButtonIcon) {
		this.disabledDefaultButtonIcon = disabledDefaultButtonIcon;
	}

	/**
	 * @param cancelButtonIcon
	 *            the cancelButtonIcon to set
	 */
	protected void setCancelButtonIcon(Icon cancelButtonIcon) {
		this.cancelButtonIcon = cancelButtonIcon;
	}

}
