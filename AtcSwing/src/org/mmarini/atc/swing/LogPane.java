/*
 * LogPane.java
 *
 * $Id: LogPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 06/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Color;
import java.text.MessageFormat;
import java.util.Date;

import javax.swing.JPanel;
import javax.swing.JTextArea;
import javax.swing.text.BadLocationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.LogTextMessageFormat;
import org.mmarini.atc.sim.Logger;
import org.mmarini.atc.sim.Message;
import org.mmarini.atc.sim.MessageConsumer;
import org.mmarini.atc.sound.Player;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: LogPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class LogPane extends JPanel implements MessageConsumer, Refreshable,
		UIAtcConstants, Logger {
	private static final int ROWS = 10;

	private static Log log = LogFactory.getLog(LogPane.class);

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private Player player;
	private AtcHandler atcHandler;
	private JTextArea area;
	private LogTextMessageFormat format;

	/**
	 * 
	 */
	public LogPane() {
		player = Player.getInstance();
		area = new JTextArea();
		format = new LogTextMessageFormat(this);
		init();
	}

	/**
         * 
         * 
         */
	public void clear() {
		area.setText("");
	}

	/**
	 * 
	 * @param message
	 */
	@Override
	public void consume(Message message) {
		format.consume(message);
		player.play(message);
	}

	/**
         * 
         * 
         */
	private void init() {
		area.setEditable(false);
		area.setBackground(Color.BLACK);
		area.setForeground(Color.GREEN);
		area.setFont(ATC_FONT);
		area.setRows(ROWS);

		setLayout(new BorderLayout());
		add(area, BorderLayout.CENTER);
	}

	/**
	 * @param text
	 */
	@Override
	public void log(String text) {
		if (area.getLineCount() >= ROWS) {
			int start;
			try {
				start = area.getLineStartOffset(0);
				int end = area.getLineEndOffset(0);
				area.replaceRange(null, start, end);
			} catch (BadLocationException e) {
				log.error(e.getMessage(), e);
				area.setText(e.getMessage());
				println();
			}
		}
		println(MessageFormat.format("{0,time} {1}", new Object[] { new Date(),
				text }));
	}

	/**
         * 
         */
	private void println() {
		area.append(System.getProperty("line.separator"));
	}

	/**
	 * @param text
	 */
	private void println(String text) {
		area.append(text);
		println();
	}

	/**
	 * @see org.mmarini.atc.swing.Refreshable#refresh()
	 */
	@Override
	public void refresh() {
		atcHandler.retrieveMessages((MessageConsumer) this);
	}

	/**
	 * @param atcHandler
	 *            the atcHandler to set
	 */
	public void setAtcHandler(AtcHandler atcHandler) {
		this.atcHandler = atcHandler;
	}
}
