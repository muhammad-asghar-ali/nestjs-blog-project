import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { User } from 'src/user/model/user.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    console.log(request);
    const user: User = request.user.user;

    return this.userService.findOne(user.id).pipe(
      map((user: User) => {
        const hasRoles = () => roles.indexOf(user.role) > -1;
        let hasPermissions = false;

        if (hasRoles()) {
          hasPermissions = true;
        }
        return user && hasPermissions;
      }),
    );
  }
}
