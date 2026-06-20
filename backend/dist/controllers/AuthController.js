"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const validation_1 = require("../utils/validation");
class AuthController {
    static async register(req, res) {
        try {
            const parsed = validation_1.registerSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            const result = await AuthService_1.AuthService.register(parsed.data);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async login(req, res) {
        try {
            const parsed = validation_1.loginSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            const result = await AuthService_1.AuthService.login(parsed.data.email, parsed.data.password);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async me(req, res) {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        return res.status(200).json({ user: req.user });
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
