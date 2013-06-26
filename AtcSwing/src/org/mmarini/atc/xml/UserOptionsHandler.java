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

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.commons.digester.Digester;
import org.apache.commons.digester.xmlrules.DigesterLoader;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mmarini.atc.sim.AtcHandler;
import org.mmarini.atc.sim.HitsMemento;
import org.springframework.core.io.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: UserOptionsHandler.java,v 1.2 2008/02/27 15:00:17 marco Exp $
 * 
 */
public class UserOptionsHandler implements XmlConstants {

    private static final String ZIP_ENTRY_NAME = "options.xml";

    private static Log log = LogFactory.getLog(UserOptionsHandler.class);

    private String optionsFilename;

    private UserOptions userOptions = new UserOptions();

    private Resource ruleResource;

    private AtcHandler atcHandler;

    /**
         * 
         * 
         */
    public void init() {
	load();
	HitsMemento memento = getHits();
	getAtcHandler().storeHits(memento);
    }

    /**
         * 
         * @return
         */
    public HitsMemento getHits() {
	HitsMemento memento = new HitsMemento();
	memento.setTable(getUserOptions().getHits());
	return memento;
    }

    /**
         * 
         * @param memento
         */
    public void setHits(HitsMemento memento) {
	getUserOptions().setHits(memento.getTable());
	store();
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
	} catch (Exception e) {
	    log.error(e.getMessage(), e);
	}
    }

    /**
         * 
         * @param is
         * @throws IOException
         * @throws SAXException
         */
    private void load(InputStream is) throws IOException, SAXException {
	Digester digester = createDigester();
	UserOptions userOptions = (UserOptions) digester.parse(is);
	if (userOptions == null) {
	    throw new SAXException("Options not found");
	}
	setUserOptions(userOptions);
    }

    /**
         * 
         * @return
         * @throws IOException
         */
    private Digester createDigester() throws IOException {
	URL url = getRuleResource().getURL();
	Digester digester = DigesterLoader.createDigester(url);
	digester.setNamespaceAware(true);
	return digester;
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
         * @return
         */
    private String createFilename() {
	String userHome = System.getProperty("user.home");
	String optFilename = userHome + File.separator + getOptionsFilename();
	return optFilename;
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

    /**
         * @return
         * @throws ParserConfigurationException
         * 
         */
    private Document createDocument() throws ParserConfigurationException {
	Document doc = DocumentBuilderFactory.newInstance()
		.newDocumentBuilder().newDocument();
	Element elem = getUserOptions().createElement(doc);
	doc.appendChild(elem);
	return doc;
    }

    /**
         * @return the optionsFilename
         */
    private String getOptionsFilename() {
	return optionsFilename;
    }

    /**
         * @param optionsFilename
         *                the optionsFilename to set
         */
    public void setOptionsFilename(String optionsFilename) {
	this.optionsFilename = optionsFilename;
    }

    /**
         * @return the userOptions
         */
    private UserOptions getUserOptions() {
	return userOptions;
    }

    /**
         * @param userOptions
         *                the userOptions to set
         */
    private void setUserOptions(UserOptions userOptions) {
	this.userOptions = userOptions;
    }

    /**
         * @return the ruleResource
         */
    private Resource getRuleResource() {
	return ruleResource;
    }

    /**
         * @param ruleResource
         *                the ruleResource to set
         */
    public void setRuleResource(Resource resource) {
	this.ruleResource = resource;
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
}
