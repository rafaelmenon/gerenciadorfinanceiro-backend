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
exports.getMonthlyReport = exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransactionById = exports.getTransactions = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
// Listar transações com filtros
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        // Extrair parâmetros de consulta
        const { startDate, endDate, type, categoryId, search, limit = "100", orderBy = "date:desc", } = req.query;
        // Construir filtros
        const filters = { userId };
        if (startDate && endDate) {
            filters.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        if (type) {
            filters.type = type;
        }
        if (categoryId) {
            filters.categoryId = categoryId;
        }
        if (search) {
            filters.description = {
                contains: search,
                mode: "insensitive",
            };
        }
        // Configurar ordenação
        const [orderField, orderDirection] = orderBy.split(":");
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
        const limitNumber = parseInt(limit);
        const take = !isNaN(limitNumber) && limitNumber > 0 ? limitNumber : 100;
        // Buscar transações
        const transactions = yield prisma.transaction.findMany({
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
    }
    catch (error) {
        console.error("Erro ao listar transações:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.getTransactions = getTransactions;
// Obter transação por ID
const getTransactionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const transaction = yield prisma.transaction.findFirst({
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
    }
    catch (error) {
        console.error("Erro ao buscar transação:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.getTransactionById = getTransactionById;
// Criar nova transação
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, description, amount, date, categoryId, repetition = client_1.RepetitionType.NONE, repeatFor, } = req.body;
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
        const category = yield prisma.category.findFirst({
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
            type: type,
            description,
            amount: parseFloat(amount.toString()),
            date: transactionDate,
            categoryId,
            userId,
            repetition: repetition,
            repeatFor: repetition === client_1.RepetitionType.FIXED
                ? parseInt(repeatFor)
                : null,
        };
        // Criar a transação principal
        const transaction = yield prisma.transaction.create({
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
        if (repetition === client_1.RepetitionType.FIXED &&
            repeatFor &&
            parseInt(repeatFor) > 0) {
            const repeats = parseInt(repeatFor);
            // Criar transações futuras
            for (let i = 1; i <= repeats; i++) {
                const futureDate = (0, date_fns_1.addMonths)(transactionDate, i);
                yield prisma.transaction.create({
                    data: Object.assign(Object.assign({}, transactionData), { date: futureDate, repetition: client_1.RepetitionType.NONE, repeatFor: null }),
                });
            }
        }
        return res.status(201).json(transaction);
    }
    catch (error) {
        console.error("Erro ao criar transação:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.createTransaction = createTransaction;
// Atualizar transação
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const transaction = yield prisma.transaction.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!transaction) {
            return res.status(404).json({ error: "Transação não encontrada" });
        }
        // Verificar se a categoria pertence ao usuário
        const category = yield prisma.category.findFirst({
            where: {
                id: categoryId,
                userId,
            },
        });
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }
        // Atualizar a transação
        const updatedTransaction = yield prisma.transaction.update({
            where: { id },
            data: {
                type: type,
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
    }
    catch (error) {
        console.error("Erro ao atualizar transação:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.updateTransaction = updateTransaction;
// Excluir transação
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        // Verificar se a transação existe
        const transaction = yield prisma.transaction.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!transaction) {
            return res.status(404).json({ error: "Transação não encontrada" });
        }
        // Excluir a transação
        yield prisma.transaction.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Erro ao excluir transação:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.deleteTransaction = deleteTransaction;
// Relatório mensal
const getMonthlyReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const startDate = (0, date_fns_1.startOfMonth)(new Date(yearNum, monthNum));
        const endDate = (0, date_fns_1.endOfMonth)(new Date(yearNum, monthNum));
        // Buscar transações do mês
        const transactions = yield prisma.transaction.findMany({
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
            if (transaction.type === client_1.TransactionType.INCOME) {
                totalIncome += transaction.amount;
            }
            else {
                totalExpense += transaction.amount;
            }
        });
        // Calcular por categoria
        const categorySummary = {};
        transactions.forEach((transaction) => {
            const categoryId = transaction.categoryId;
            const categoryName = transaction.category.name;
            if (!categorySummary[categoryId]) {
                categorySummary[categoryId] = { total: 0, category: categoryName };
            }
            if (transaction.type === client_1.TransactionType.EXPENSE) {
                categorySummary[categoryId].total += transaction.amount;
            }
        });
        // Dados para gráfico
        const chartData = Object.values(categorySummary).sort((a, b) => b.total - a.total);
        // Montar resposta
        const report = {
            period: {
                year: yearNum,
                month: monthNum + 1,
                startDate: (0, date_fns_1.format)(startDate, "yyyy-MM-dd"),
                endDate: (0, date_fns_1.format)(endDate, "yyyy-MM-dd"),
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
    }
    catch (error) {
        console.error("Erro ao gerar relatório mensal:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.getMonthlyReport = getMonthlyReport;
//# sourceMappingURL=transaction.controller.js.map