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
exports.updateProfile = exports.getProfile = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// Obter perfil do usuário
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        // Não retornar a senha no response
        const { password } = user, userData = __rest(user, ["password"]);
        return res.json(userData);
    }
    catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.getProfile = getProfile;
// Atualizar perfil do usuário
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { name, email, currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        // Buscar o usuário
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        // Dados que serão atualizados
        const updateData = {};
        // Atualizar nome
        if (name) {
            updateData.name = name;
        }
        // Atualizar email
        if (email && email !== user.email) {
            // Verificar se o email já está em uso
            const emailExists = yield prisma.user.findUnique({
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
            const passwordMatch = yield bcrypt_1.default.compare(currentPassword, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: "Senha atual incorreta" });
            }
            // Hash da nova senha
            updateData.password = yield bcrypt_1.default.hash(newPassword, 10);
        }
        // Atualizar o usuário
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        // Não retornar a senha no response
        const { password } = updatedUser, userData = __rest(updatedUser, ["password"]);
        return res.json(userData);
    }
    catch (error) {
        console.error("Erro ao atualizar perfil do usuário:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});
exports.updateProfile = updateProfile;
//# sourceMappingURL=user.controller.js.map