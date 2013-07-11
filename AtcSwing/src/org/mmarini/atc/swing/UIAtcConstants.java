/*
 * UIAtcConstants.java
 *
 * $Id: UIAtcConstants.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.Font;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UIAtcConstants.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public interface UIAtcConstants {
	public static final String EXIT_IMAGE = "/images/exit.png";
	public static final String CANCEL_IMAGE = "/images/cancel.png";
	public static final String BUTTON_IMAGE = "/images/button.png";
	public static final String DISABLED_BUTTON_IMAGE = "/images/disabledButton.png";

	public static final String[] LEVEL_IMAGES = { "/images/fl360Button.png",
			"/images/fl320Button.png", "/images/fl280Button.png",
			"/images/fl240Button.png", "/images/fl200Button.png",
			"/images/fl160Button.png", "/images/fl120Button.png",
			"/images/fl080Button.png", "/images/fl040Button.png", };

	public static final Font ATC_FONT = Font.decode("Dialog PLAIN 11");

	public static final int THRESHOLD_DISTANCE = 10;

	public static final String HOLD_COMMAND = "Hold";
	public static final String LAND_COMMAND = "Land";
	public static final String FLIGHT_LEVEL_COMMAND = "FlightLevel";
	public static final String TURN_COMMAND = "Turn";
}
