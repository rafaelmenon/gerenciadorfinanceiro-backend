import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar se já existe um usuário com o email admin@example.com
    const existingUser = await prisma.user.findUnique({
      where: {
        email: "admin@example.com",
      },
    });

    if (existingUser) {
      console.log("Usuário administrador já existe!");
      return;
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Criar o usuário administrador
    const admin = await prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@example.com",
        password: hashedPassword,
      },
    });

    console.log("Usuário administrador criado com sucesso:", admin.email);

    // Criar categorias padrão para o usuário
    const defaultCategories = [
      "Alimentação",
      "Moradia",
      "Transporte",
      "Saúde",
      "Educação",
      "Lazer",
      "Salário",
      "Investimentos",
      "Outros",
    ];

    await Promise.all(
      defaultCategories.map((categoryName) =>
        prisma.category.create({
          data: {
            name: categoryName,
            userId: admin.id,
          },
        })
      )
    );

    console.log("Categorias padrão criadas para o usuário administrador");
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
