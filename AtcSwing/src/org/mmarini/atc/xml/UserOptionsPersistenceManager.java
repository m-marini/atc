/*
 * UserOptionsHandler.java
 *
 * $Id: UserOptionsHandler.java,v 1.2 2008/02/27 15:00:17 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.xml;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.jar.JarFile;
import java.util.jar.JarOutputStream;
import java.util.zip.ZipEntry;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.HitsMemento;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UserOptionsHandler.java,v 1.2 2008/02/27 15:00:17 marco Exp $
 * 
 */
public class UserOptionsPersistenceManager implements XmlConstants {

	private static final String OPTIONS_SCHEMA = "/options-0.1.0.xsd";
	private static final String OPTION_FILENAME = ".atc.jar";
	private static final String ZIP_ENTRY_NAME = "options.xml";

	private static Log log = LogFactory
			.getLog(UserOptionsPersistenceManager.class);

	private UserOptions userOptions;

	/**
	 * 
	 */
	public UserOptionsPersistenceManager() {
		userOptions = new UserOptions();
		load();
	}

	/**
	 * @return
	 * @throws ParserConfigurationException
	 * 
	 */
	private Document createDocument() throws ParserConfigurationException {
		Document doc = DocumentBuilderFactory.newInstance()
				.newDocumentBuilder().newDocument();
		Element elem = userOptions.createElement(doc);
		doc.appendChild(elem);
		return doc;
	}

	/**
	 * @return
	 */
	private String createFilename() {
		String userHome = System.getProperty("user.home");
		String optFilename = userHome + File.separator + OPTION_FILENAME;
		log.info(optFilename);
		return optFilename;
	}

	/**
	 * 
	 * @return
	 */
	public HitsMemento getHits() {
		HitsMemento memento = new HitsMemento();
		memento.setTable(userOptions.getHits());
		return memento;
	}

	/**
         * 
         * 
         */
	private void load() {
		try {
			String optFilename = createFilename();
			JarFile file = new JarFile(optFilename);
			InputStream is = file.getInputStream(new ZipEntry(ZIP_ENTRY_NAME));
			load(is);
			file.close();
		} catch (Exception e) {
			log.error(e.getMessage(), e);
		}
	}

	/**
	 * 
	 * @param is
	 * @throws IOException
	 * @throws SAXException
	 * @throws ParserConfigurationException
	 */
	private void load(InputStream is) throws IOException, SAXException,
			ParserConfigurationException {
		SchemaFactory schemaFactory = SchemaFactory
				.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
		URL schemaUrl = getClass().getResource(OPTIONS_SCHEMA);
		Schema schema = schemaFactory.newSchema(schemaUrl);
		SAXParserFactory parserFactory = SAXParserFactory.newInstance();
		parserFactory.setSchema(schema);
		SAXParser parser = parserFactory.newSAXParser();
		UserOptionsHandler handler = new UserOptionsHandler();
		parser.parse(is, handler);
		userOptions = handler.getUserOptions();
		if (userOptions == null) {
			throw new SAXException("Options not found");
		}
	}

	/**
	 * 
	 * @param memento
	 */
	public void setHits(HitsMemento memento) {
		userOptions.setHits(memento.getTable());
		store();
	}

	/**
         * 
         * 
         */
	private void store() {
		try {
			String optFilename = createFilename();
			FileOutputStream fos = new FileOutputStream(optFilename);
			JarOutputStream jos = new JarOutputStream(fos);
			jos.putNextEntry(new ZipEntry(ZIP_ENTRY_NAME));
			writeXml(jos);
			jos.closeEntry();
			jos.close();
		} catch (Exception e) {
			log.error(e.getMessage(), e);
		}
	}

	/**
	 * 
	 * @param stream
	 * @throws ParserConfigurationException
	 * @throws TransformerFactoryConfigurationError
	 * @throws TransformerException
	 */
	private void writeXml(OutputStream stream)
			throws ParserConfigurationException,
			TransformerFactoryConfigurationError, TransformerException {
		Document doc = createDocument();
		Result result = new StreamResult(stream);
		Source source = new DOMSource(doc);
		Transformer trans = TransformerFactory.newInstance().newTransformer();
		trans.transform(source, result);
	}
}
