import { Router } from "express";
import * as TransactionController from "../controllers/transaction.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Todas as rotas de transações requerem autenticação
router.use(authMiddleware);

// Listar transações com filtros
router.get("/", TransactionController.getTransactions);

// Obter transação por ID
router.get("/:id", TransactionController.getTransactionById);

// Criar nova transação
router.post("/", TransactionController.createTransaction);

// Atualizar transação
router.put("/:id", TransactionController.updateTransaction);

// Excluir transação
router.delete("/:id", TransactionController.deleteTransaction);

// Relatório mensal
router.get("/report/:year/:month", TransactionController.getMonthlyReport);

export default router;
