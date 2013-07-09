package org.mmarini.atc.jsf;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

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

    public static final String REFRESH_FORWARD = "/refresh.jsp";

    public static final String DISPATCH_COMMAND_ERROR_FORWARD = "/dispatchCommandError.jsp";

    public static final String RESPONSE_COMMAND_FORWARD = "/responseCommand.jsp";

    /**
         * 
         */
    private static final long serialVersionUID = 1L;

    private static Log log = LogFactory.getLog(RefreshServlet.class);

    /**
         * @see javax.servlet.http.HttpServlet#doGet(HttpServletRequest request,
         *      HttpServletResponse response)
         */
    protected void doGet(HttpServletRequest request,
	    HttpServletResponse response) throws ServletException, IOException {
	doPost(request, response);
    }

    /**
         * @see javax.servlet.http.HttpServlet#doPost(HttpServletRequest
         *      request, HttpServletResponse response)
         */
    protected void doPost(HttpServletRequest request,
	    HttpServletResponse response) throws ServletException, IOException {
	String cmd = request.getParameter(CMD_PARAM);
	String forward = DISPATCH_COMMAND_ERROR_FORWARD;
	if (REFRESH_CMD.equals(cmd)) {
	    UserGame game = (UserGame) request.getSession().getAttribute(
		    USER_GAME);
	    game.refresh();
	    forward = REFRESH_FORWARD;
	} else if (FLIGHT_LEVEL_CMD.equals(cmd)) {
	    UserGame game = (UserGame) request.getSession().getAttribute(
		    USER_GAME);
	    String planeId = request.getParameter(PLANE_PARAM);
	    String flightLevelId = request.getParameter(FLIGHT_LEVEL_PARAM);
	    game.sendFlightLevel(planeId, flightLevelId);
	    forward = RESPONSE_COMMAND_FORWARD;
	} else if (HOLD_CMD.equals(cmd)) {
	    UserGame game = (UserGame) request.getSession().getAttribute(
		    USER_GAME);
	    String planeId = request.getParameter(PLANE_PARAM);
	    String condId = request.getParameter(CONDITION_PARAM);
	    game.sendHold(planeId, condId);
	    forward = RESPONSE_COMMAND_FORWARD;
	} else if (LAND_CMD.equals(cmd)) {
	    UserGame game = (UserGame) request.getSession().getAttribute(
		    USER_GAME);
	    String planeId = request.getParameter(PLANE_PARAM);
	    String locationId = request.getParameter(LOCATION_PARM);
	    game.sendClearToLand(planeId, locationId);
	    forward = RESPONSE_COMMAND_FORWARD;
	} else if (TURN_CMD.equals(cmd)) {
	    UserGame game = (UserGame) request.getSession().getAttribute(
		    USER_GAME);
	    String planeId = request.getParameter(PLANE_PARAM);
	    String locationId = request.getParameter(LOCATION_PARM);
	    String condId = request.getParameter(CONDITION_PARAM);
	    game.sendTurnTo(planeId, locationId, condId);
	    forward = RESPONSE_COMMAND_FORWARD;
	} else if (EXIT_CMD.equals(cmd)) {
	    UserGame game = (UserGame) request.getSession().getAttribute(
		    USER_GAME);
	    game.exitGame();
	    forward = RESPONSE_COMMAND_FORWARD;
	} else {
	    log.error("Unrecognized command cmd=" + cmd);
	}
	getServletContext().getRequestDispatcher(forward).forward(request,
		response);
    }
}