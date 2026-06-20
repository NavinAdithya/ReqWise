import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { loginSchema, registerSchema } from '../utils/validation';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      const result = await AuthService.register(parsed.data);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      const result = await AuthService.login(parsed.data.email, parsed.data.password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.status(200).json({ user: req.user });
  }
}
export default AuthController;
