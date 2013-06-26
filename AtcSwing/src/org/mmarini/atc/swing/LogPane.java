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
    private static Log log = LogFactory.getLog(LogPane.class);

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    private Player player;

    private AtcHandler atcHandler;

    private JTextArea area = new JTextArea();

    private LogTextMessageFormat format = new LogTextMessageFormat(this);

    /**
         * 
         * 
         */
    public void init() {
	JTextArea area = getArea();
	area.setEditable(false);
	area.setBackground(Color.BLACK);
	area.setForeground(Color.GREEN);
	area.setFont(ATC_FONT);
	setLayout(new BorderLayout());
	add(area, BorderLayout.CENTER);
    }

    /**
         * 
         * @param rows
         */
    public void setRows(int rows) {
	getArea().setRows(rows);
    }

    /**
         * @see org.mmarini.atc.swing.Refreshable#refresh()
         */
    public void refresh() {
	getAtcHandler().retrieveMessages((MessageConsumer) this);
    }

    /**
         * 
         * @param message
         */
    public void consume(Message message) {
	getFormat().consume(message);
	getPlayer().play(message);
    }

    /**
         * @param text
         */
    public void log(String text) {
	JTextArea area = getArea();
	int rows = area.getRows();
	if (area.getLineCount() >= rows) {
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
         * @param text
         */
    private void println(String text) {
	JTextArea area = getArea();
	area.append(text);
	println();
    }

    /**
         * 
         */
    private void println() {
	JTextArea area = getArea();
	area.append(System.getProperty("line.separator"));
    }

    /**
         * @return the atcHandler
         */
    private AtcHandler getAtcHandler() {
	return atcHandler;
    }

    /**
         * @param atcHandler
         *                the atcHandler to set
         */
    public void setAtcHandler(AtcHandler atcHandler) {
	this.atcHandler = atcHandler;
    }

    /**
         * @return the area
         */
    private JTextArea getArea() {
	return area;
    }

    /**
         * @return the player
         */
    private Player getPlayer() {
	return player;
    }

    /**
         * @param player
         *                the player to set
         */
    public void setPlayer(Player player) {
	this.player = player;
    }

    /**
         * @return the format
         */
    private LogTextMessageFormat getFormat() {
	return format;
    }

    /**
         * 
         * 
         */
    public void clear() {
	getArea().setText("");
    }

}
