const DashboardModel = require('../models/dashboard.model');

const DashboardController = {

  // GET /api/dashboard
  async index(req, res, next) {
    try {
      const metricas = await DashboardModel.getMetricas();
      return res.status(200).json({ success: true, data: metricas });
    } catch (error) { next(error); }
  },
};

module.exports = DashboardController;