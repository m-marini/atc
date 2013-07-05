package org.mmarini.atc.sound;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;
import javax.sound.sampled.FloatControl;
import javax.sound.sampled.Line;
import javax.sound.sampled.LineUnavailableException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class BufferedPlayer {

	private static Log log = LogFactory.getLog(BufferedPlayer.class);

	private Queue<AudioInputStream> aisBuffer;

	private Clip clip;

	private float gain;

	/**
         * 
         */
	public BufferedPlayer() {
		aisBuffer = new ConcurrentLinkedQueue<AudioInputStream>();
		Line.Info info = new Line.Info(Clip.class);
		try {
			clip = (Clip) AudioSystem.getLine(info);
		} catch (LineUnavailableException e1) {
			log.error(e1.getMessage(), e1);
			return;
		}
		Thread thread = new Thread(new Runnable() {

			@Override
			public void run() {
				process();
			}
		});
		thread.start();
	}

	/**
         * 
         */
	private void dequeueAudioInputStream() {
		log.debug("clip ended");
		AudioInputStream ais = getAisBuffer().poll();
		if (ais != null) {
			startClip(ais);
		} else {
			log.debug("no stream ready");
		}
	}

	/**
	 * @return the aisBuffer
	 */
	private Queue<AudioInputStream> getAisBuffer() {
		return aisBuffer;
	}

	/**
	 * @param ais
	 */
	public void playStream(AudioInputStream ais) {
		getAisBuffer().offer(ais);
		log.debug("enqueued " + ais);
		synchronized (this) {
			notify();
		}
	}

	/**
         * 
         * 
         */
	private void process() {
		for (;;) {
			synchronized (this) {
				waitForReady();
				log.debug("woke up.");
				if (!clip.isRunning()) {
					dequeueAudioInputStream();
				}
			}
		}
	}

	/**
	 * 
	 * @param gain
	 */
	public synchronized void setGain(float gain) {
		this.gain = gain;
	}

	/**
	 * @param ais
	 * 
	 */
	private void startClip(AudioInputStream ais) {
		log.debug("dequeued " + ais);
		try {
			clip.stop();
			if (clip.isOpen()) {
				log.debug("close clip");
				clip.close();
			}
			log.debug("open clip " + ais);
			clip.open(ais);
			while (!clip.isOpen())
				;
			ais.close();
			FloatControl control = (FloatControl) clip
					.getControl(FloatControl.Type.MASTER_GAIN);
			control.setValue(gain);
			log.debug("start clip");
			clip.start();
			while (!clip.isRunning())
				;
			log.debug("isRunning " + clip.isRunning());
		} catch (Exception e) {
			log.error(e.getMessage(), e);
		}
	}

	/**
	 * @return
	 */
	private void waitForReady() {
		if (!clip.isRunning() && !getAisBuffer().isEmpty())
			return;
		if (!clip.isRunning()) {
			try {
				wait(0);
			} catch (InterruptedException e) {
				log.error(e.getMessage(), e);
			}
			return;
		}
		long time = (clip.getMicrosecondLength() - clip
				.getMicrosecondPosition()) / 1000;
		if (time == 0) {
			while (clip.isRunning())
				;
			return;
		}
		try {
			wait(time);
		} catch (InterruptedException e) {
			log.error(e.getMessage(), e);
		}
	}
}
