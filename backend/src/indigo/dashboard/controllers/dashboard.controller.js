const dashboardService = require('../services/dashboard.service');

async function obtenerDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.obtenerDashboard(req.user);

    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  obtenerDashboard,
};