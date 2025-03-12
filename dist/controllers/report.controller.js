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
exports.ReportController = void 0;
const client_1 = require("@prisma/client");
const formatters_1 = require("../utils/formatters");
const prisma = new client_1.PrismaClient();
// Controlador para relatórios
exports.ReportController = {
    // Obter relatório mensal com resumo por categoria
    getMonthlyReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // @ts-ignore - O middleware de autenticação adiciona o userId
                const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (!userId) {
                    return res.status(401).json({ error: "Usuário não autenticado." });
                }
                const year = parseInt(req.params.year, 10);
                const month = parseInt(req.params.month, 10);
                // Validar os parâmetros
                if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
                    return res.status(400).json({ error: "Parâmetros inválidos." });
                }
                // Definir o período do mês
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0); // Último dia do mês
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
                    orderBy: {
                        date: "desc",
                    },
                });
                // Calcular totais
                let totalIncome = 0;
                let totalExpense = 0;
                transactions.forEach((transaction) => {
                    if (transaction.type === "INCOME") {
                        totalIncome += transaction.amount;
                    }
                    else {
                        totalExpense += transaction.amount;
                    }
                });
                // Agrupar despesas por categoria
                const categoryMap = new Map();
                transactions
                    .filter((transaction) => transaction.type === "EXPENSE")
                    .forEach((transaction) => {
                    var _a;
                    const categoryName = ((_a = transaction.category) === null || _a === void 0 ? void 0 : _a.name) || "Sem categoria";
                    const currentTotal = categoryMap.get(categoryName) || 0;
                    categoryMap.set(categoryName, currentTotal + transaction.amount);
                });
                const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, total]) => ({
                    category,
                    total,
                }));
                // Ordenar por valor (maior para menor)
                categoryBreakdown.sort((a, b) => b.total - a.total);
                // Montar o objeto de resposta
                const response = {
                    period: {
                        year,
                        month,
                        startDate: (0, formatters_1.formatDate)(startDate),
                        endDate: (0, formatters_1.formatDate)(endDate),
                    },
                    summary: {
                        totalIncome,
                        totalExpense,
                        balance: totalIncome - totalExpense,
                    },
                    categoryBreakdown,
                    transactions: transactions.map((t) => {
                        var _a;
                        return ({
                            id: t.id,
                            description: t.description,
                            amount: t.amount,
                            date: (0, formatters_1.formatDate)(t.date),
                            type: t.type,
                            category: ((_a = t.category) === null || _a === void 0 ? void 0 : _a.name) || "Sem categoria",
                        });
                    }),
                };
                return res.json(response);
            }
            catch (error) {
                console.error("Erro ao gerar relatório mensal:", error);
                return res.status(500).json({ error: "Erro ao gerar relatório mensal." });
            }
        });
    },
    // Obter resumo do ano
    getYearSummary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // @ts-ignore - O middleware de autenticação adiciona o userId
                const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (!userId) {
                    return res.status(401).json({ error: "Usuário não autenticado." });
                }
                const year = parseInt(req.params.year, 10);
                // Validar o parâmetro
                if (isNaN(year)) {
                    return res.status(400).json({ error: "Ano inválido." });
                }
                // Definir o período do ano
                const startDate = new Date(year, 0, 1);
                const endDate = new Date(year, 11, 31);
                // Buscar transações do ano
                const transactions = yield prisma.transaction.findMany({
                    where: {
                        userId,
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                });
                // Inicializar dados mensais
                const monthlyData = Array(12)
                    .fill(0)
                    .map((_, i) => ({
                    month: i + 1,
                    income: 0,
                    expense: 0,
                    balance: 0,
                }));
                // Somatório anual
                let yearIncome = 0;
                let yearExpense = 0;
                // Calcular totais por mês
                transactions.forEach((transaction) => {
                    const month = transaction.date.getMonth();
                    if (transaction.type === "INCOME") {
                        monthlyData[month].income += transaction.amount;
                        yearIncome += transaction.amount;
                    }
                    else {
                        monthlyData[month].expense += transaction.amount;
                        yearExpense += transaction.amount;
                    }
                });
                // Calcular balanço para cada mês
                monthlyData.forEach((month) => {
                    month.balance = month.income - month.expense;
                });
                // Montar o objeto de resposta
                const response = {
                    year,
                    summary: {
                        totalIncome: yearIncome,
                        totalExpense: yearExpense,
                        balance: yearIncome - yearExpense,
                    },
                    months: monthlyData,
                };
                return res.json(response);
            }
            catch (error) {
                console.error("Erro ao gerar resumo anual:", error);
                return res.status(500).json({ error: "Erro ao gerar resumo anual." });
            }
        });
    },
    // Obter análise por categorias
    getCategoryBreakdown(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // @ts-ignore - O middleware de autenticação adiciona o userId
                const userId = req.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (!userId) {
                    return res.status(401).json({ error: "Usuário não autenticado." });
                }
                const { startDate, endDate, type = "EXPENSE" } = req.query;
                // Validar os parâmetros
                if (!startDate || !endDate) {
                    return res
                        .status(400)
                        .json({ error: "Período de datas é obrigatório." });
                }
                // Validar o tipo
                const transactionType = type;
                if (transactionType !== "EXPENSE" && transactionType !== "INCOME") {
                    return res
                        .status(400)
                        .json({ error: "Tipo inválido. Use EXPENSE ou INCOME." });
                }
                // Converter strings para datas
                const start = new Date(startDate);
                const end = new Date(endDate);
                // Buscar transações do período e tipo
                const transactions = yield prisma.transaction.findMany({
                    where: {
                        userId,
                        type: transactionType,
                        date: {
                            gte: start,
                            lte: end,
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
                });
                // Agrupar por categoria
                const categoryMap = new Map();
                let total = 0;
                transactions.forEach((transaction) => {
                    var _a;
                    const categoryName = ((_a = transaction.category) === null || _a === void 0 ? void 0 : _a.name) || "Sem categoria";
                    const currentTotal = categoryMap.get(categoryName) || 0;
                    categoryMap.set(categoryName, currentTotal + transaction.amount);
                    total += transaction.amount;
                });
                // Calcular percentuais
                const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, value]) => ({
                    category,
                    total: value,
                    percentage: total > 0 ? Number((value / total).toFixed(4)) : 0,
                }));
                // Ordenar por valor (maior para menor)
                categoryBreakdown.sort((a, b) => b.total - a.total);
                return res.json(categoryBreakdown);
            }
            catch (error) {
                console.error("Erro ao gerar análise por categorias:", error);
                return res
                    .status(500)
                    .json({ error: "Erro ao gerar análise por categorias." });
            }
        });
    },
};
//# sourceMappingURL=report.controller.js.map