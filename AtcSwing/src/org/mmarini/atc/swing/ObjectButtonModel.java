/*
 * ObjectButtonModel.java
 *
 * $Id: ObjectButtonModel.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import javax.swing.JToggleButton;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: ObjectButtonModel.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class ObjectButtonModel extends JToggleButton.ToggleButtonModel {

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    private Object selectedObject;

    /**
         * 
         */
    public ObjectButtonModel() {
    }

    /**
         * @param selectedObject
         */
    public ObjectButtonModel(Object selectedObject) {
	this.selectedObject = selectedObject;
    }

    /**
         * @return the selectedObject
         */
    public Object getSelectedObject() {
	return selectedObject;
    }

    /**
         * @param selectedObject
         *                the selectedObject to set
         */
    public void setSelectedObject(Object selectedObject) {
	this.selectedObject = selectedObject;
    }

    /**
         * @see javax.swing.DefaultButtonModel#getSelectedObjects()
         */
    @Override
    public Object[] getSelectedObjects() {
	return new Object[] { getSelectedObject() };
    }
}
