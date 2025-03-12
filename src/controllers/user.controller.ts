import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Obter perfil do usuário
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Não retornar a senha no response
    const { password, ...userData } = user;

    return res.json(userData);
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar perfil do usuário
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { name, email, currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Dados que serão atualizados
    const updateData: any = {};

    // Atualizar nome
    if (name) {
      updateData.name = name;
    }

    // Atualizar email
    if (email && email !== user.email) {
      // Verificar se o email já está em uso
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: "Este email já está em uso" });
      }

      updateData.email = email;
    }

    // Atualizar senha
    if (currentPassword && newPassword) {
      // Verificar senha atual
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      // Hash da nova senha
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Não retornar a senha no response
    const { password, ...userData } = updatedUser;

    return res.json(userData);
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};
