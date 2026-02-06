import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuthenticationException } from '../../../shared/http/exceptions/business.exception';
import { ErrorCodes } from '../../../shared/http/exceptions/error-codes';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new AuthenticationException(
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Access token has expired',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (info?.name === 'JsonWebTokenError') {
        throw new AuthenticationException(
          ErrorCodes.AUTH_TOKEN_INVALID,
          'Invalid access token',
        );
      }
      throw new AuthenticationException(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Authentication required',
      );
    }
    return user;
  }
}
