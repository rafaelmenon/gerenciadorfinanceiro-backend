import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rota para relatório mensal
router.get("/monthly/:year/:month", ReportController.getMonthlyReport);

// Rota para resumo anual
router.get("/annual/:year", ReportController.getYearSummary);

// Rota para análise por categorias
router.get("/category-breakdown", ReportController.getCategoryBreakdown);

export default router;
