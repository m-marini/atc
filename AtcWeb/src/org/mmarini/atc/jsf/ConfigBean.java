/*
 * ConfigBean.java
 *
 * $Id: ConfigBean.java,v 1.3 2008/03/01 21:17:52 marco Exp $
 *
 * 18/feb/08
 *
 * Copyright notice
 */
package org.mmarini.atc.jsf;

import java.sql.SQLException;

import javax.naming.NamingException;

import org.mmarini.atc.db.PersistenceManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author marco.marini@mmarini.org
 * @version $Id: ConfigBean.java,v 1.3 2008/03/01 21:17:52 marco Exp $
 * 
 */
public class ConfigBean {
	private static final String PASSWORD = "ATC123";
	private static Logger log = LoggerFactory.getLogger(ConfigBean.class);

	private String password;

	private String testResult;

	/**
	 * 
	 */
	public ConfigBean() {
		testResult = "";
	}

	/**
         * 
         */
	private boolean checkForAccess() {
		String psw = getPassword();
		password = null;
		if (!PASSWORD.equals(psw)) {
			testResult = "Access Denied";
			return false;
		}
		return true;
	}

	/**
	 * 
	 * @return
	 */
	public String createTables() {
		if (!checkForAccess())
			return null;
		try {
			PersistenceManager pm = new PersistenceManager();
			pm.createTables();
			pm.close();
			testResult = "Table created";
		} catch (NamingException e) {
			log.error(e.getMessage(), e);
			testResult = e.getMessage();
		} catch (SQLException e) {
			log.error(e.getMessage(), e);
			testResult = e.getMessage();
		}
		return null;
	}

	/**
	 * @return the password
	 */
	public String getPassword() {
		return password;
	}

	/**
	 * @return the testResult
	 */
	public String getTestResult() {
		return testResult;
	}

	/**
	 * @param password
	 *            the password to set
	 */
	public void setPassword(String password) {
		this.password = password;
	}

	/**
	 * 
	 * @return
	 */
	public String testDatabase() {
		try {
			PersistenceManager pm = new PersistenceManager();
			testResult = pm.testDatabase();
			pm.close();
		} catch (NamingException e) {
			log.error(e.getMessage(), e);
			testResult = e.getMessage();
		} catch (SQLException e) {
			log.error(e.getMessage(), e);
			testResult = e.getMessage();
		}
		return null;
	}
}
