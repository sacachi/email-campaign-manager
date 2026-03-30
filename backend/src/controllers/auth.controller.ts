import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/errors';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const password_hash = await hashPassword(password);

    const user = await User.create({
      email,
      name,
      password_hash,
    });

    res.status(201).json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const { comparePassword } = await import('../utils/password');
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
}
