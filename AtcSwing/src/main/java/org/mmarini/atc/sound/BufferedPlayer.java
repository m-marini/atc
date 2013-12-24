package org.mmarini.atc.sound;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;
import javax.sound.sampled.FloatControl;
import javax.sound.sampled.Line;
import javax.sound.sampled.LineUnavailableException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BufferedPlayer {

	private static final float DEFAULT_GAIN = -10f;
	private static Logger log = LoggerFactory.getLogger(BufferedPlayer.class);
	private Queue<AudioInputStream> aisBuffer;
	private Clip clip;

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
		AudioInputStream ais = aisBuffer.poll();
		if (ais != null) {
			startClip(ais);
		} else {
			log.debug("no stream ready");
		}
	}

	/**
	 * @param ais
	 */
	public void playStream(AudioInputStream ais) {
		aisBuffer.offer(ais);
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
			control.setValue(DEFAULT_GAIN);
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
		if (!clip.isRunning() && !aisBuffer.isEmpty())
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
