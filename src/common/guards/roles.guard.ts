import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from 'src/users/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]

        )

        if (!requiredRoles) {
            return true; // If no roles are required, allow access
        }

        const { user } = context.switchToHttp().getRequest();

        // If the user is not authenticated, deny access
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('You are not authorized to access this resource');
        }

        // Check if the user's role is included in the required roles
        return requiredRoles.includes(user.role);
    }
}