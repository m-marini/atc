/*
 * EndGamePane.java
 *
 * $Id: HelpPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 *
 * 13/gen/08
 *
 * Copyright notice
 */
package org.mmarini.atc.swing;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.io.IOException;
import java.text.MessageFormat;

import javax.swing.JDialog;
import javax.swing.JEditorPane;
import javax.swing.JOptionPane;
import javax.swing.JScrollPane;
import javax.swing.event.HyperlinkEvent;
import javax.swing.event.HyperlinkListener;
import javax.swing.text.html.HTMLDocument;
import javax.swing.text.html.HTMLFrameHyperlinkEvent;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: HelpPane.java,v 1.2 2008/02/27 15:00:16 marco Exp $
 * 
 */
public class HelpPane extends JOptionPane implements UIAtcConstants {

	private static final String HELP_INDEX_HTML = "/help/index.html";

	private static final String HTML_ERROR = "<html><body><h2>Error</h2><p>{0}</p></body></html>";

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private static Log log = LogFactory.getLog(HelpPane.class);
	private JEditorPane pane;

	/**
	 * 
	 */
	public HelpPane() {
		pane = new JEditorPane();
		init();
	}

	/**
	 * 
	 * @param e
	 */
	private void handleHyperlinkUpdate(HyperlinkEvent e) {
		if (e.getEventType() == HyperlinkEvent.EventType.ACTIVATED) {
			if (e instanceof HTMLFrameHyperlinkEvent) {
				((HTMLDocument) pane.getDocument())
						.processHTMLFrameHyperlinkEvent((HTMLFrameHyperlinkEvent) e);
			} else {
				try {
					pane.setPage(e.getURL());
				} catch (IOException ioe) {
					String message = ioe.getMessage();
					log.error(message, ioe);
					showErrorMessage(ioe);
				}
			}
		}
	}

	/**
	 * 
	 */
	private void init() {
		setLayout(new BorderLayout());
		pane.setEditable(false);
		pane.setContentType("text/html");
		pane.addHyperlinkListener(new HyperlinkListener() {
			@Override
			public void hyperlinkUpdate(HyperlinkEvent e) {
				handleHyperlinkUpdate(e);
			}
		});
		add(new JScrollPane(pane), BorderLayout.CENTER);
		setPreferredSize(new Dimension(640, 480));
	}

	/**
	 * @see java.awt.Component#show()
	 */
	public void showDialog() {
		try {
			pane.setPage(getClass().getResource(HELP_INDEX_HTML));
		} catch (Exception e) {
			log.error(e.getMessage(), e);
			showErrorMessage(e);
		}
		JDialog dialog = createDialog(this, "Help");
		dialog.setVisible(true);
	}

	/**
	 * @param ex
	 */
	private void showErrorMessage(Exception ex) {
		String html = MessageFormat.format(HTML_ERROR,
				new Object[] { ex.getMessage() });
		pane.setText(html);
	}
}
