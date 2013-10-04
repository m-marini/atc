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
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Result;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.sax.SAXTransformerFactory;
import javax.xml.transform.sax.TransformerHandler;
import javax.xml.transform.stream.StreamResult;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;

import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.HitsMemento;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.AttributesImpl;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UserOptionsHandler.java,v 1.2 2008/02/27 15:00:17 marco Exp $
 * 
 */
public class UserOptionsPersistenceManager implements XmlConstants {

	private static final String CDATA_ATTR_TYPE = "CDATA";
	private static final String EMPTY_STRING = "";
	private static final String OPTIONS_SCHEMA = "/xsd/options-0.1.0.xsd";
	private static final String OPTION_FILENAME = ".atc.jar";
	private static final String ZIP_ENTRY_NAME = "options.xml";
	private static final Attributes EMPTY_ATTRIBUTES = new AttributesImpl();

	private static Logger log = LoggerFactory
			.getLogger(UserOptionsPersistenceManager.class);

	private UserOptions userOptions;
	private TransformerHandler handler;

	/**
	 * 
	 */
	public UserOptionsPersistenceManager() {
		userOptions = new UserOptions();
		load();
	}

	/**
	 * @return
	 */
	private String createFilename() {
		String userHome = System.getProperty("user.home");
		String optFilename = userHome + File.separator + OPTION_FILENAME;
		return optFilename;
	}

	/**
	 * 
	 * @param stream
	 * @throws TransformerFactoryConfigurationError
	 * @throws TransformerConfigurationException
	 * @throws SAXException
	 */
	private void createXml(OutputStream stream)
			throws TransformerFactoryConfigurationError,
			TransformerConfigurationException, SAXException {
		Result result = new StreamResult(stream);

		SAXTransformerFactory factory = (SAXTransformerFactory) TransformerFactory
				.newInstance();
		handler = factory.newTransformerHandler();
		Transformer tr = handler.getTransformer();
		tr.setOutputProperty(OutputKeys.ENCODING, "UTF-8");

		handler.setResult(result);
		handler.startDocument();

		handler.startElement(ATC_OPTIONS_NS, EMPTY_STRING, OPTIONS_ELEM,
				EMPTY_ATTRIBUTES);
		handler.startElement(ATC_OPTIONS_NS, EMPTY_STRING, HITS_ELEMENT,
				EMPTY_ATTRIBUTES);

		AttributesImpl attrs = new AttributesImpl();
		for (GameRecord record : userOptions.getHits()) {
			attrs.clear();
			attrs.addAttribute(EMPTY_STRING, EMPTY_STRING, NAME_ATTR,
					CDATA_ATTR_TYPE, String.valueOf(record.getName()));
			attrs.addAttribute(EMPTY_STRING, EMPTY_STRING, PROFILE_ATTR,
					CDATA_ATTR_TYPE, String.valueOf(record.getProfile()));
			attrs.addAttribute(EMPTY_STRING, EMPTY_STRING, MAP_NAME_ATTR,
					CDATA_ATTR_TYPE, String.valueOf(record.getMapName()));
			attrs.addAttribute(EMPTY_STRING, EMPTY_STRING,
					ITERATION_COUNT_ATTR, CDATA_ATTR_TYPE,
					String.valueOf(record.getIterationCount()));
			attrs.addAttribute(EMPTY_STRING, EMPTY_STRING, PLANE_COUNT_ATTR,
					CDATA_ATTR_TYPE, String.valueOf(record.getPlaneCount()));
			attrs.addAttribute(EMPTY_STRING, EMPTY_STRING, TIME_ATTR,
					CDATA_ATTR_TYPE, String.valueOf(record.getTime()));
			handler.startElement(ATC_OPTIONS_NS, EMPTY_STRING, RECORD_ELEM,
					attrs);
			handler.endElement(ATC_OPTIONS_NS, EMPTY_STRING, RECORD_ELEM);
		}

		handler.endElement(ATC_OPTIONS_NS, EMPTY_STRING, HITS_ELEMENT);
		handler.endElement(ATC_OPTIONS_NS, EMPTY_STRING, OPTIONS_ELEM);

		handler.endDocument();
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
			ZipEntry zipEntry = new ZipEntry(ZIP_ENTRY_NAME);
			InputStream is = file.getInputStream(zipEntry);
			load(is);
			is.close();
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
		parserFactory.setNamespaceAware(true);
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

			createXml(jos);

			jos.closeEntry();
			jos.close();
			fos.close();
		} catch (Exception e) {
			log.error(e.getMessage(), e);
		}
	}
}
