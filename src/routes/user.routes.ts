import { Router } from "express";
import * as UserController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Todas as rotas de usuários requerem autenticação
router.use(authMiddleware);

// Obter perfil do usuário
router.get("/profile", UserController.getProfile);

// Atualizar perfil do usuário
router.put("/profile", UserController.updateProfile);

export default router;
