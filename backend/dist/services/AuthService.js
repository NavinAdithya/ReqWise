"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || 'reqwise_secret_key_12345';
const JWT_EXPIRES_IN = '24h';
class AuthService {
    static generateToken(user) {
        return jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            role: user.role
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    static async register(userData) {
        const existingUser = await User_1.User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const user = new User_1.User(userData);
        await user.save();
        // Omit password from output
        const userJson = user.toJSON();
        delete userJson.password;
        const token = this.generateToken(user);
        return { token, user: userJson };
    }
    static async login(email, password) {
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isMatch = await user.comparePassword(password || '');
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }
        const userJson = user.toJSON();
        delete userJson.password;
        const token = this.generateToken(user);
        return { token, user: userJson };
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
