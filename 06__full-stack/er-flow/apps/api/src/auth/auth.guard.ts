import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from './auth.js';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Better Auth checks req headers to verify the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new UnauthorizedException("Unauthorized: Invalid or missing session");
    }

    // Attach user and session context to request
    request.user = session.user;
    request.session = session.session;

    return true;
  }
}
