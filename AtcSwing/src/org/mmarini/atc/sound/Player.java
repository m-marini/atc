/*
 * Player.java
 *
 * $Id: Player.java,v 1.2 2008/02/27 15:00:25 marco Exp $
 *
 * 09/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.sound;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.CollisionMessage;
import org.mmarini.atc.sim.CrashedMessage;
import org.mmarini.atc.sim.EnteredMessage;
import org.mmarini.atc.sim.LandedMessage;
import org.mmarini.atc.sim.Message;
import org.mmarini.atc.sim.MessageVisitorAdapter;
import org.mmarini.atc.sim.RightExitMessage;
import org.mmarini.atc.sim.WrongExitMessage;
import org.mmarini.atc.sim.WrongRunwayMessage;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: Player.java,v 1.2 2008/02/27 15:00:25 marco Exp $
 * 
 */
public class Player extends MessageVisitorAdapter {

	public static final String LANDED_WRONG_RUNWAY = "landedWrongRunway";

	public static final String EXITED_WRONG_WAY = "exitedWrongWay";

	public static final String LANDED = "landed";

	public static final String EXITED = "exited";

	public static final String ENTERED_AT = "enteredAt";

	public static final String CRASHED = "crashed";

	public static final String COLLISION = "collision";

	public static final String AND = "and";

	public static final String TURN_HEADING_TO = "turnHeadingTo";

	public static final String AT = "at";

	public static final String HOLD_ON = "HoldOn";

	public static final String CHANGE_FLIGHT_LEVEL = "changeFlightLevel";

	public static final String CLEAR_TO_LAND = "clearToLandRunway";

	private static final int LOAD_BUFFER = 1024;

	private static Log log = LogFactory.getLog(Player.class);

	private Map<String, byte[]> clipCache = new HashMap<String, byte[]>();

	private BufferedPlayer bufferedPlayer;

	/**
         * 
         */
	public Player() {
	}

	/**
	 * 
	 * @param data
	 * @return
	 */
	private AudioInputStream createAudioInputStream(byte[] data) {
		ByteArrayInputStream in = new ByteArrayInputStream(data);
		AudioInputStream ais = null;
		try {
			ais = AudioSystem.getAudioInputStream(in);
		} catch (Exception e) {
			log.error("Error creating AudioInputStream", e);
		}
		return ais;
	}

	/**
	 * @param id
	 * @return
	 */
	private byte[] getAudioData(String id) {
		Map<String, byte[]> cache = getClipCache();
		byte[] data = cache.get(id);
		if (data == null) {
			data = loadAudioData(id);
			if (data != null)
				cache.put(id, data);
		}
		return data;
	}

	/**
	 * 
	 * @param id
	 * @return
	 */
	private AudioInputStream getAudioInputStream(String id) {
		byte[] data = getAudioData(id);
		if (data == null) {
			return null;
		}
		return createAudioInputStream(data);
	}

	/**
	 * @return the bufferedPlayer
	 */
	private BufferedPlayer getBufferedPlayer() {
		return bufferedPlayer;
	}

	/**
	 * @return the clipCache
	 */
	private Map<String, byte[]> getClipCache() {
		return clipCache;
	}

	/**
         * 
         * 
         */
	public void init() {
		for (int i = 0; i < 10; ++i) {
			getAudioData(String.valueOf(i));
		}
		for (int i = 0; i < 26; ++i) {
			getAudioData(String.valueOf((char) (i + 'A')));
		}
	}

	/**
	 * 
	 * @param id
	 * @return
	 */
	private byte[] loadAudioData(String id) {
		String resName = "/audio/" + id.toLowerCase() + ".wav";
		URL url = Thread.currentThread().getContextClassLoader()
				.getResource(resName);
		url = getClass().getResource(resName);
		log.debug("load " + resName + " " + url);
		if (url == null) {
			log.error("Error loading sample " + resName);
			return null;
		}
		try {
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			InputStream in = url.openStream();
			byte[] bfr = new byte[LOAD_BUFFER];
			int n;
			while ((n = in.read(bfr)) > 0) {
				out.write(bfr, 0, n);
			}
			in.close();
			out.close();
			byte[] data = out.toByteArray();
			log.debug("loaded " + data.length);
			return data;
		} catch (IOException e) {
			log.error(e.getMessage(), e);
		}
		return null;
	}

	/**
	 * 
	 * @param ais
	 */
	private void play(AudioInputStream ais) {
		getBufferedPlayer().playStream(ais);
	}

	/**
	 * 
	 * @param message
	 */
	public void play(Message message) {
		message.apply(this);
	}

	/**
	 * 
	 * @param id
	 */
	public void playSample(String id) {
		log.debug("play " + id);
		AudioInputStream ais = getAudioInputStream(id);
		if (ais == null)
			return;
		play(ais);
	}

	/**
	 * @param bufferedPlayer
	 *            the bufferedPlayer to set
	 */
	public void setBufferedPlayer(BufferedPlayer bufferedPlayer) {
		this.bufferedPlayer = bufferedPlayer;
	}

	/**
	 * 
	 * @param c
	 */
	private void spell(char c) {
		playSample(String.valueOf(c));
	}

	/**
	 * 
	 * @param text
	 */
	public void spell(String text) {
		for (int i = 0; i < text.length(); ++i) {
			spell(text.charAt(i));
		}
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.CollisionMessage)
	 */
	@Override
	public void visit(CollisionMessage message) {
		playSample(COLLISION);
		spell(message.getPlane0());
		playSample(AND);
		spell(message.getPlane1());
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.CrashedMessage)
	 */
	@Override
	public void visit(CrashedMessage message) {
		spell(message.getPlaneId());
		playSample(CRASHED);
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.EnteredMessage)
	 */
	@Override
	public void visit(EnteredMessage message) {
		spell(message.getPlaneId());
		playSample(ENTERED_AT);
		spell(message.getGatewayId());
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.LandedMessage)
	 */
	@Override
	public void visit(LandedMessage message) {
		spell(message.getPlaneId());
		playSample(LANDED);
		spell(message.getGatewayId());
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.RightExitMessage)
	 */
	@Override
	public void visit(RightExitMessage message) {
		spell(message.getPlaneId());
		playSample(EXITED);
		spell(message.getGatewayId());
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.WrongExitMessage)
	 */
	@Override
	public void visit(WrongExitMessage message) {
		spell(message.getPlaneId());
		playSample(EXITED_WRONG_WAY);
	}

	/**
	 * @see org.mmarini.atc.sim.MessageVisitorAdapter#visit(org.mmarini.atc.sim.WrongRunwayMessage)
	 */
	@Override
	public void visit(WrongRunwayMessage message) {
		spell(message.getPlaneId());
		playSample(LANDED_WRONG_RUNWAY);
	}
}
