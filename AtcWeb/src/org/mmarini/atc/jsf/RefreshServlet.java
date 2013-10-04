package org.mmarini.atc.jsf;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mmarini.atc.sim.Plane;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;

/**
 * Servlet implementation class for Servlet: RefreshServlet
 * 
 */
public class RefreshServlet extends HttpServlet implements ServletConstants {

	public static final String LOCATION_PARM = "location";
	public static final String FLIGHT_LEVEL_PARAM = "flightLevel";
	public static final String PLANE_PARAM = "plane";
	public static final String CONDITION_PARAM = "condition";
	public static final String CMD_PARAM = "cmd";

	public static final String EXIT_CMD = "exitGame";
	public static final String TURN_CMD = "turn";
	public static final String HOLD_CMD = "hold";
	public static final String FLIGHT_LEVEL_CMD = "flightLevel";
	public static final String LAND_CMD = "land";
	public static final String REFRESH_CMD = "refresh";

	/**
         * 
         */
	private static final long serialVersionUID = 1L;

	private static Logger log = LoggerFactory.getLogger(RefreshServlet.class);

	/**
	 * @see javax.servlet.http.HttpServlet#doGet(HttpServletRequest request,
	 *      HttpServletResponse response)
	 */
	@Override
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

	/**
	 * @see javax.servlet.http.HttpServlet#doPost(HttpServletRequest request,
	 *      HttpServletResponse response)
	 */
	@Override
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		String cmd = request.getParameter(CMD_PARAM);
		UserGame game = (UserGame) request.getSession().getAttribute(USER_GAME);
		boolean refresh = false;
		if (REFRESH_CMD.equals(cmd)) {
			refresh = true;
			game.refresh();
		} else if (FLIGHT_LEVEL_CMD.equals(cmd)) {
			String planeId = request.getParameter(PLANE_PARAM);
			String flightLevelId = request.getParameter(FLIGHT_LEVEL_PARAM);
			game.sendFlightLevel(planeId, flightLevelId);
		} else if (HOLD_CMD.equals(cmd)) {
			String planeId = request.getParameter(PLANE_PARAM);
			String condId = request.getParameter(CONDITION_PARAM);
			game.sendHold(planeId, condId);
		} else if (LAND_CMD.equals(cmd)) {
			String planeId = request.getParameter(PLANE_PARAM);
			String locationId = request.getParameter(LOCATION_PARM);
			game.sendClearToLand(planeId, locationId);
		} else if (TURN_CMD.equals(cmd)) {
			String planeId = request.getParameter(PLANE_PARAM);
			String locationId = request.getParameter(LOCATION_PARM);
			String condId = request.getParameter(CONDITION_PARAM);
			game.sendTurnTo(planeId, locationId, condId);
		} else if (EXIT_CMD.equals(cmd)) {
			game.exitGame();
		} else {
			log.error("Unrecognized command cmd=" + cmd);
		}

		// Prepare response
		RefreshData refreshData = new RefreshData();
		if (refresh)
			refreshData.setCommand(game.isGameOver() ? "setGameOver()"
					: "refreshLater()");
		refreshData.setPlanePane(game.getPlaneListLog());
		refreshData.setLogPane(game.getLogRows());
		List<JsonPlane> planes = refreshData.getPlaneList();
		planes.clear();
		for (Plane plane : game.getPlaneList()) {
			JsonPlane jPlane = new JsonPlane();
			jPlane.setId(plane.getId());
			jPlane.setFlightLevel(plane.getFlightLevelId());
			jPlane.setHeading(plane.getHeading());
			jPlane.setX(plane.getPosition().getX());
			jPlane.setY(plane.getPosition().getY());
			jPlane.setSpeed(plane.getSpeed());
			jPlane.setClassId(plane.getClassId());
			planes.add(jPlane);
		}

		// Output reponse
		Gson gson = new Gson();
		response.setContentType("application/json");
		response.getWriter().write(gson.toJson(refreshData));
	}
}