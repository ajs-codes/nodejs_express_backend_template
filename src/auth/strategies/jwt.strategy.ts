import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { Request } from 'express';
import { getAuthConfig } from '../../config/auth.js';
import { accessTokenPayloadSchema } from '../jwt.js';
import { userRepository } from '../../repositories/user.repository.js';

function extractJwtFromCookie(req: Request): string | null {
  const config = getAuthConfig();
  const token = req.cookies?.[config.cookieName] as string | undefined;
  return token ?? null;
}

export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie]),
    secretOrKey: getAuthConfig().jwtAccessSecret,
    passReqToCallback: false,
  },
  async (payload, done) => {
    try {
      const parsed = accessTokenPayloadSchema.parse(payload);
      const user = await userRepository.findById(parsed.sub);
      if (!user) {
        done(null, false);
        return;
      }
      done(null, { id: user.id, email: user.email, name: user.name });
    } catch (error) {
      done(error, false);
    }
  },
);
