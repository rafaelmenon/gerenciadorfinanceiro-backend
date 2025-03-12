import { Router } from "express";
import * as CategoryController from "../controllers/category.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Todas as rotas de categorias requerem autenticação
router.use(authMiddleware);

// Listar todas as categorias
router.get("/", CategoryController.getCategories);

// Obter categoria por ID
router.get("/:id", CategoryController.getCategoryById);

// Criar nova categoria
router.post("/", CategoryController.createCategory);

// Atualizar categoria
router.put("/:id", CategoryController.updateCategory);

// Excluir categoria
router.delete("/:id", CategoryController.deleteCategory);

export default router;
