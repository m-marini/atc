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

import javax.swing.AbstractButton;
import javax.swing.BorderFactory;
import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JPanel;
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

    private Resource cancelButtonResource;

    private Resource defaultButtonResource;

    private Icon defaultButtonIcon;

    private Icon disabledDefaultButtonIcon;

    private Resource disabledDefaultButtonResource;

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

	    public void actionPerformed(ActionEvent arg0) {
		getCommandController().cancel();
	    }

	});
	Icon icon = createIcon(getCancelButtonResource());
	if (icon != null) {
	    btn.setIcon(icon);
	    btn.setHorizontalTextPosition(AbstractButton.RIGHT);
	}
	icon = createIcon(getDefaultButtonResource());
	setDefaultButtonIcon(icon);
	icon = createIcon(getDisabledDefaultButtonResource());
	setDisabledDefaultButtonIcon(icon);
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
         * 
         */
    public void actionPerformed(ActionEvent event) {
	String locationId = event.getActionCommand();
	getCommandController().notifyLocationSelection(locationId);
    }

    /**
         * @return the commandController
         */
    protected CommandController getCommandController() {
	return commandController;
    }

    /**
         * @param commandController
         *                the commandController to set
         */
    public void setCommandController(CommandController commandController) {
	this.commandController = commandController;
    }

    /**
         * @return the cancelBtn
         */
    protected JButton getCancelBtn() {
	return cancelBtn;
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
	Icon icon = getDefaultButtonIcon();
	if (icon != null) {
	    btn.setIcon(icon);
	    btn.setHorizontalTextPosition(AbstractButton.RIGHT);
	}
	icon = getDisabledDefaultButtonIcon();
	if (icon != null) {
	    btn.setDisabledIcon(icon);
	}
	return btn;
    }

    /**
         * @param cancelBtn
         *                the cancelBtn to set
         */
    private void setCancelBtn(JButton cancelBtn) {
	this.cancelBtn = cancelBtn;
    }

    /**
         * @return the cancelButtonResource
         */
    private Resource getCancelButtonResource() {
	return cancelButtonResource;
    }

    /**
         * @param cancelButtonResource
         *                the cancelButtonResource to set
         */
    public void setCancelButtonResource(Resource buttonResource) {
	this.cancelButtonResource = buttonResource;
    }

    /**
         * @return the defaultButtonIcon
         */
    protected Icon getDefaultButtonIcon() {
	return defaultButtonIcon;
    }

    /**
         * @param defaultButtonIcon
         *                the defaultButtonIcon to set
         */
    private void setDefaultButtonIcon(Icon defaultButtonIcon) {
	this.defaultButtonIcon = defaultButtonIcon;
    }

    /**
         * @return the defaultButtonResource
         */
    private Resource getDefaultButtonResource() {
	return defaultButtonResource;
    }

    /**
         * @param defaultButtonResource
         *                the defaultButtonResource to set
         */
    public void setDefaultButtonResource(Resource defaultButtonResource) {
	this.defaultButtonResource = defaultButtonResource;
    }

    /**
         * @return the disabledDefaultButtonResource
         */
    private Resource getDisabledDefaultButtonResource() {
	return disabledDefaultButtonResource;
    }

    /**
         * @param disabledDefaultButtonResource
         *                the disabledDefaultButtonResource to set
         */
    public void setDisabledDefaultButtonResource(
	    Resource disabledDefaultButtonResource) {
	this.disabledDefaultButtonResource = disabledDefaultButtonResource;
    }

    /**
         * @return the disabledDefaultButtonIcon
         */
    private Icon getDisabledDefaultButtonIcon() {
	return disabledDefaultButtonIcon;
    }

    /**
         * @param disabledDefaultButtonIcon
         *                the disabledDefaultButtonIcon to set
         */
    private void setDisabledDefaultButtonIcon(Icon disabledDefaultButtonIcon) {
	this.disabledDefaultButtonIcon = disabledDefaultButtonIcon;
    }
}
