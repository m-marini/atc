/*
 * Message.java
 *
 * $Id: Message.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sim;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Message.java,v 1.2 2008/02/15 18:06:58 marco Exp $
 * 
 */
public interface Message {
    /**
         * 
         * @param visitor
         */
    public void apply(MessageVisitor visitor);
}
