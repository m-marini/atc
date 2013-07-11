/**
 * 
 */
package org.mmarini.atc.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.rmi.PortableRemoteObject;
import javax.sql.DataSource;

import org.mmarini.atc.sim.GameRecord;
import org.mmarini.atc.sim.HitsMemento;

/**
 * @author us00852
 * 
 */
public class PersistenceManager {
	private static final String JNDI_DATASOURCE_NAME = "java:comp/env/jdbc/atcDatabase";
	private static final String SELECT_STATEMENT = "select name,planeCount,iterationCount,profile,time,mapName from AtcRecord order by ord";
	private static final String DELETE_STATEMENT = "delete from AtcRecord";
	private static final String INSERT_STATEMENT = "insert into AtcRecord (name,planeCount,iterationCount,profile,time,ord,mapName) values(?,?,?,?,?,?,?)";
	private static final String CREATE_STATEMENT = "create table AtcRecord(name varchar(32) not null,planeCount integer not null,iterationCount integer not null,profile varchar(32) not null,mapName varchar(32) not null,time bigint not null,ord integer not null)";
	private static final String DROP_STATEMENT = "drop table if exists AtcRecord";

	private Connection connection;

	/**
	 * 
	 */
	public PersistenceManager() {
	}

	/**
	 * @throws SQLException
	 * 
	 */
	public void close() throws SQLException {
		if (connection != null) {
			try {
				connection.close();
			} finally {
				connection = null;
			}
		}
	}

	/**
	 * 
	 * @return
	 * @throws NamingException
	 * @throws SQLException
	 */
	private void createConnection() throws NamingException, SQLException {
		if (connection == null) {
			Context ctx = new InitialContext();
			Object obj = ctx.lookup(JNDI_DATASOURCE_NAME);
			DataSource ds = (DataSource) PortableRemoteObject.narrow(obj,
					DataSource.class);
			connection = ds.getConnection();
		}
	}

	/**
	 * @throws SQLException
	 * @throws NamingException
	 * 
	 */
	public void createMemento(HitsMemento memento) throws NamingException,
			SQLException {
		createConnection();
		PreparedStatement stm = connection.prepareStatement(INSERT_STATEMENT);
		try {
			int ord = 0;
			for (GameRecord record : memento.getTable()) {
				int idx = 1;
				stm.setString(idx++, record.getName());
				stm.setInt(idx++, record.getPlaneCount());
				stm.setInt(idx++, record.getIterationCount());
				stm.setString(idx++, record.getProfile());
				stm.setLong(idx++, record.getTime());
				stm.setInt(idx++, ord);
				stm.setString(idx++, record.getMapName());

				stm.executeUpdate();
				++ord;
			}
		} finally {
			stm.close();
		}
	}

	/**
	 * 
	 * @throws NamingException
	 * @throws SQLException
	 */
	public void createTables() throws NamingException, SQLException {
		executeStatement(DROP_STATEMENT);
		executeStatement(CREATE_STATEMENT);
	}

	/**
	 * @throws SQLException
	 * @throws NamingException
	 * 
	 */
	public void deleteMemento() throws NamingException, SQLException {
		executeStatement(DELETE_STATEMENT);
	}

	/**
	 * 
	 * @param sqlStatement
	 * @throws NamingException
	 * @throws SQLException
	 */
	private void executeStatement(String sqlStatement) throws NamingException,
			SQLException {
		createConnection();
		Statement stm = connection.createStatement();
		try {
			stm.executeUpdate(sqlStatement);
		} finally {
			stm.close();
		}
	}

	/**
	 * 
	 * @param memento
	 * @throws SQLException
	 * @throws NamingException
	 */
	public void retrieveMemento(HitsMemento memento) throws SQLException,
			NamingException {
		createConnection();
		Statement stm = connection.createStatement();
		try {
			ResultSet set = stm.executeQuery(SELECT_STATEMENT);
			try {
				List<GameRecord> table = new ArrayList<>();
				while (set.next()) {
					String name = set.getString("name");
					int planeCount = set.getInt("planeCount");
					int iterationCount = set.getInt("iterationCount");
					String profile = set.getString("profile");
					String mapName = set.getString("mapName");
					long time = set.getLong("time");

					GameRecord record = new GameRecord();
					record.setName(name);
					record.setProfile(profile);
					record.setIterationCount(iterationCount);
					record.setPlaneCount(planeCount);
					record.setMapName(mapName);
					record.setTime(time);

					table.add(record);
				}
				memento.setTable(table);
			} finally {
				set.close();
			}
		} finally {
			stm.close();
		}
	}

	/**
	 * 
	 * @return
	 * @throws SQLException
	 * @throws NamingException
	 */
	public String testDatabase() throws NamingException, SQLException {
		createConnection();
		return "OK";
	}

	/**
	 * 
	 * @param memento
	 * @throws SQLException
	 * @throws NamingException
	 */
	public void updateMemento(HitsMemento memento) throws NamingException,
			SQLException {
		deleteMemento();
		createMemento(memento);
	}
}
