/*
 * MenuPaneListener.java
 *
 * $Id: MenuPaneListener.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: MenuPaneListener.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public interface MenuPaneListener {

    /**
         * 
         * @param string
         * @param f
         */
    public abstract void startNewGame(String string, String id);

    /**
         * 
         * 
         */
    public abstract void exitGame();

    /**
         * 
         * 
         */
    public abstract void openHelp();

}
