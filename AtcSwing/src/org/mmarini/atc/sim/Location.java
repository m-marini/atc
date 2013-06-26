/*
 * Location.java
 *
 * $Id: Location.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 *
 * 03/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Location.java,v 1.3 2008/02/27 14:55:48 marco Exp $
 * 
 */
public interface Location {
    /**
         * 
         * @return
         */
    public abstract String getId();

    /**
         * 
         * @return
         */
    public abstract Position getPosition();

    /**
         * 
         * @return
         */
    public abstract String getAlignment();

    /**
         * 
         * 
         */
    public abstract void update();
}
