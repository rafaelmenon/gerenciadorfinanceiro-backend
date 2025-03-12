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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // Verificar se os campos obrigatórios foram fornecidos
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ error: "Todos os campos são obrigatórios" });
        }
        // Verificar se o usuário já existe
        const userExists = yield prisma.user.findUnique({
            where: { email },
        });
        if (userExists) {
            return res.status(400).json({ error: "Usuário já existe" });
        }
        // Criar hash da senha
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Criar o usuário
        const user = yield prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
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
        yield Promise.all(defaultCategories.map((categoryName) => prisma.category.create({
            data: {
                name: categoryName,
                userId: user.id,
            },
        })));
        // Não retornar a senha no response
        const { password: _ } = user, userData = __rest(user, ["password"]);
        return res.status(201).json(userData);
    }
    catch (error) {
        console.error("Erro ao registrar usuário:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Verificar se os campos obrigatórios foram fornecidos
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios" });
        }
        // Buscar o usuário pelo email
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
        // Verificar a senha
        const passwordMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
        // Gerar o token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });
        // Não retornar a senha no response
        const { password: _ } = user, userData = __rest(user, ["password"]);
        return res.json({
            user: userData,
            token,
        });
    }
    catch (error) {
        console.error("Erro ao fazer login:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.login = login;
//# sourceMappingURL=auth.controller.js.map