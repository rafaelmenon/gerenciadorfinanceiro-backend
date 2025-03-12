"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticação em todas as rotas
router.use(auth_middleware_1.authMiddleware);
// Rota para relatório mensal
router.get("/monthly/:year/:month", report_controller_1.ReportController.getMonthlyReport);
// Rota para resumo anual
router.get("/annual/:year", report_controller_1.ReportController.getYearSummary);
// Rota para análise por categorias
router.get("/category-breakdown", report_controller_1.ReportController.getCategoryBreakdown);
exports.default = router;
//# sourceMappingURL=report.routes.js.map