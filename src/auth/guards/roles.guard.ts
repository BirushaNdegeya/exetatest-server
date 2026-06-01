import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../models/user.model';
import { UserRole, UserRoleEnum } from '../../models/user-role.model';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isConfiguredAdminEmail } from '../utils/admin-access.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    @InjectModel(UserRole)
    private userRoleModel: typeof UserRole,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const userRoles = await this.userRoleModel.findAll({
      where: { userId: user.id },
    });

    const hasRole = userRoles.some((role) => requiredRoles.includes(role.role));
    const requiresAdminRole = requiredRoles.includes(UserRoleEnum.ADMIN);

    if (!hasRole && requiresAdminRole) {
      const dbUser = await this.userModel.findByPk(user.id);
      const adminEmails = this.configService.get<string>('ADMIN_EMAILS');

      if (isConfiguredAdminEmail(dbUser?.email, adminEmails)) {
        return true;
      }
    }

    if (!hasRole) {
      throw new ForbiddenException(
        `Vous devez avoir l'un des rôles suivants : ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
