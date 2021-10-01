import { NextFunction, Request, Response } from 'express';
import AppError from '@shared/errors/AppError';
import { verify } from 'jsonwebtoken';
import authConfig from '@config/auth';

interface ITokenPayload {
  iat: number;
  exp: number;
  sub: string;
}

export const blacklist: string[] = [];

export function isBlacklisted(token: string): boolean {
  return blacklist.some(t => t === token);
}

export default function isAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token está faltando');
  }

  const [, token] = authHeader.split(' ');

  try {
    const decodedToken = verify(token, authConfig.jwt.secret as string);

    if (isBlacklisted(token)) {
      throw new AppError('JWT token inválido');
    }

    const { sub } = decodedToken as ITokenPayload;

    request.user = {
      id: +sub,
    };

    return next();
  } catch {
    throw new AppError('JWT token inválido');
  }
}
