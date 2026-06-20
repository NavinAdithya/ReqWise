import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'reqwise_secret_key_12345';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  static generateToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static async register(userData: { name: string; email: string; password?: string; role: 'ADMIN' | 'QA' | 'CLIENT' }) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    const user = new User(userData);
    await user.save();
    
    // Omit password from output
    const userJson = user.toJSON();
    delete userJson.password;
    
    const token = this.generateToken(user);
    return { token, user: userJson };
  }

  static async login(email: string, password?: string) {
    const user = await User.findOne({ email }).select('+password');
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
export default AuthService;
