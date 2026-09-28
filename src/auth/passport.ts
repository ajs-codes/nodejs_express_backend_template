import passport from 'passport';
import { jwtStrategy } from './strategies/jwt.strategy.js';

passport.use(jwtStrategy);

export { passport };
