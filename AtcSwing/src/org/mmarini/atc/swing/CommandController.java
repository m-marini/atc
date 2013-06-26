/*
 * CommandController.java
 *
 * $Id: CommandController.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 05/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: CommandController.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public interface CommandController {
    /**
         * 
         * @param planeId
         */
    public abstract void notifyPlaneSelection(String planeId);

    /**
         * 
         * @param commandId
         */
    public abstract void notifyCommandSelection(String commandId);

    /**
         * 
         * @param locationId
         */
    public abstract void notifyLocationSelection(String locationId);

    /**
         * 
         * @param flightLevel
         */
    public abstract void notifyFlightLevelSelection(String flightLevel);

    /**
         * 
         * 
         */
    public abstract void cancel();
}
