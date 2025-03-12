import { Request, Response } from "express";
import { PrismaClient, TransactionType, RepetitionType } from "@prisma/client";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";

const prisma = new PrismaClient();

// Listar transações com filtros
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Extrair parâmetros de consulta
    const {
      startDate,
      endDate,
      type,
      categoryId,
      search,
      limit = "100",
      orderBy = "date:desc",
    } = req.query;

    // Construir filtros
    const filters: any = { userId };

    if (startDate && endDate) {
      filters.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (type) {
      filters.type = type as TransactionType;
    }

    if (categoryId) {
      filters.categoryId = categoryId as string;
    }

    if (search) {
      filters.description = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    // Configurar ordenação
    const [orderField, orderDirection] = (orderBy as string).split(":");

    // Validar campo de ordenação
    const validOrderFields = [
      "date",
      "amount",
      "description",
      "id",
      "createdAt",
      "updatedAt",
    ];
    const field = validOrderFields.includes(orderField) ? orderField : "date";

    // Validar direção de ordenação
    const direction = orderDirection === "asc" ? "asc" : "desc";

    // Calcular limite
    const limitNumber = parseInt(limit as string);
    const take = !isNaN(limitNumber) && limitNumber > 0 ? limitNumber : 100;

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { [field]: direction },
      take: take,
    });

    return res.json(transactions);
  } catch (error) {
    console.error("Erro ao listar transações:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter transação por ID
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    return res.json(transaction);
  } catch (error) {
    console.error("Erro ao buscar transação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Criar nova transação
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      type,
      description,
      amount,
      date,
      categoryId,
      repetition = RepetitionType.NONE,
      repeatFor,
    } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Validações
    if (!type || !description || !amount || !date || !categoryId) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    // Verificar se a categoria pertence ao usuário
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    // Criação da transação
    const transactionDate = new Date(date);

    // Dados base da transação
    const transactionData = {
      type: type as TransactionType,
      description,
      amount: parseFloat(amount.toString()),
      date: transactionDate,
      categoryId,
      userId,
      repetition: repetition as RepetitionType,
      repeatFor:
        repetition === RepetitionType.FIXED
          ? parseInt(repeatFor as string)
          : null,
    };

    // Criar a transação principal
    const transaction = await prisma.transaction.create({
      data: transactionData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Se tiver repetição, criar as transações futuras
    if (
      repetition === RepetitionType.FIXED &&
      repeatFor &&
      parseInt(repeatFor as string) > 0
    ) {
      const repeats = parseInt(repeatFor as string);

      // Criar transações futuras
      for (let i = 1; i <= repeats; i++) {
        const futureDate = addMonths(transactionDate, i);

        await prisma.transaction.create({
          data: {
            ...transactionData,
            date: futureDate,
            repetition: RepetitionType.NONE, // As transações criadas não se repetem
            repeatFor: null,
          },
        });
      }
    }

    return res.status(201).json(transaction);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar transação
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, description, amount, date, categoryId } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Validações
    if (!type || !description || !amount || !date || !categoryId) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    // Verificar se a transação existe
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    // Verificar se a categoria pertence ao usuário
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    // Atualizar a transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: type as TransactionType,
        description,
        amount: parseFloat(amount.toString()),
        date: new Date(date),
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json(updatedTransaction);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Excluir transação
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Verificar se a transação existe
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    // Excluir a transação
    await prisma.transaction.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Relatório mensal
export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { year, month } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Validações
    if (!year || !month) {
      return res.status(400).json({ error: "Ano e mês são obrigatórios" });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JS Date meses são 0-11

    // Datas do início e fim do mês
    const startDate = startOfMonth(new Date(yearNum, monthNum));
    const endDate = endOfMonth(new Date(yearNum, monthNum));

    // Buscar transações do mês
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === TransactionType.INCOME) {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });

    // Calcular por categoria
    const categorySummary: Record<string, { total: number; category: string }> =
      {};

    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId;
      const categoryName = transaction.category.name;

      if (!categorySummary[categoryId]) {
        categorySummary[categoryId] = { total: 0, category: categoryName };
      }

      if (transaction.type === TransactionType.EXPENSE) {
        categorySummary[categoryId].total += transaction.amount;
      }
    });

    // Dados para gráfico
    const chartData = Object.values(categorySummary).sort(
      (a, b) => b.total - a.total
    );

    // Montar resposta
    const report = {
      period: {
        year: yearNum,
        month: monthNum + 1,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      categoryBreakdown: chartData,
      transactions,
    };

    return res.json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório mensal:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};
