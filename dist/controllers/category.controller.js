"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Listar todas as categorias do usuário
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const categories = yield prisma.category.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
        return res.json(categories);
    }
    catch (error) {
        console.error("Erro ao listar categorias:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.getCategories = getCategories;
// Obter categoria por ID
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const category = yield prisma.category.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }
        return res.json(category);
    }
    catch (error) {
        console.error("Erro ao buscar categoria:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.getCategoryById = getCategoryById;
// Criar nova categoria
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        if (!name) {
            return res.status(400).json({ error: "Nome da categoria é obrigatório" });
        }
        // Verificar se a categoria já existe para este usuário
        const existingCategory = yield prisma.category.findFirst({
            where: {
                name,
                userId,
            },
        });
        if (existingCategory) {
            return res.status(400).json({ error: "Categoria já existe" });
        }
        const category = yield prisma.category.create({
            data: {
                name,
                userId,
            },
        });
        return res.status(201).json(category);
    }
    catch (error) {
        console.error("Erro ao criar categoria:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.createCategory = createCategory;
// Atualizar categoria
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        if (!name) {
            return res.status(400).json({ error: "Nome da categoria é obrigatório" });
        }
        // Verificar se a categoria existe
        const category = yield prisma.category.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }
        // Verificar se já existe outra categoria com o mesmo nome
        const existingCategory = yield prisma.category.findFirst({
            where: {
                name,
                userId,
                id: { not: id },
            },
        });
        if (existingCategory) {
            return res
                .status(400)
                .json({ error: "Já existe uma categoria com este nome" });
        }
        const updatedCategory = yield prisma.category.update({
            where: { id },
            data: { name },
        });
        return res.json(updatedCategory);
    }
    catch (error) {
        console.error("Erro ao atualizar categoria:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.updateCategory = updateCategory;
// Excluir categoria
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        // Verificar se a categoria existe
        const category = yield prisma.category.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }
        // Verificar se existem transações associadas a esta categoria
        const transactionsCount = yield prisma.transaction.count({
            where: { categoryId: id },
        });
        if (transactionsCount > 0) {
            return res.status(400).json({
                error: "Não é possível excluir a categoria pois existem transações associadas a ela",
            });
        }
        yield prisma.category.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Erro ao excluir categoria:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map