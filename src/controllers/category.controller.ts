import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Listar todas as categorias do usuário
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    return res.json(categories);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter categoria por ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    return res.json(category);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Criar nova categoria
export const createCategory = async (req: Request, res: Response) => {
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
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId,
      },
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Categoria já existe" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        userId,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar categoria
export const updateCategory = async (req: Request, res: Response) => {
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
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    // Verificar se já existe outra categoria com o mesmo nome
    const existingCategory = await prisma.category.findFirst({
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

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return res.json(updatedCategory);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Excluir categoria
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    // Verificar se existem transações associadas a esta categoria
    const transactionsCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionsCount > 0) {
      return res.status(400).json({
        error:
          "Não é possível excluir a categoria pois existem transações associadas a ela",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};
