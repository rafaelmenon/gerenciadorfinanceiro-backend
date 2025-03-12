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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function createAdminUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Verificar se já existe um usuário com o email admin@example.com
            const existingUser = yield prisma.user.findUnique({
                where: {
                    email: "admin@example.com",
                },
            });
            if (existingUser) {
                console.log("Usuário administrador já existe!");
                return;
            }
            // Criar hash da senha
            const hashedPassword = yield bcrypt_1.default.hash("admin123", 10);
            // Criar o usuário administrador
            const admin = yield prisma.user.create({
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
            yield Promise.all(defaultCategories.map((categoryName) => prisma.category.create({
                data: {
                    name: categoryName,
                    userId: admin.id,
                },
            })));
            console.log("Categorias padrão criadas para o usuário administrador");
        }
        catch (error) {
            console.error("Erro ao criar usuário administrador:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
createAdminUser();
//# sourceMappingURL=createAdminUser.js.map