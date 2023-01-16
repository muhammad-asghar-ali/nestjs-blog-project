import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { catchError, map, Observable, of } from 'rxjs';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles-guard';
import { DeleteResult, UpdateResult } from 'typeorm';
import { UserRole } from './model/user.entity';
import { User } from './model/user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() user: User): Observable<User | object> {
    return this.userService.create(user).pipe(
      map((user: User) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @Post('login')
  login(@Body() user: User): Observable<object> {
    return this.userService.login(user).pipe(
      map((jwt: string) => {
        return { access_token: jwt };
      }),
    );
  }

  @Get(':id')
  findOne(@Param() params): Observable<User> {
    return this.userService.findOne(params.id);
  }

  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  index(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Observable<Pagination<User>> {
    limit = limit > 100 ? 100 : limit;
    return this.userService.paginate({
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() user: User,
  ): Observable<UpdateResult> {
    return this.userService.update(Number(id), user);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Observable<DeleteResult> {
    return this.userService.delete(Number(id));
  }

  @hasRoles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/role')
  updateRoleOfUser(
    @Param('id') id: string,
    @Body() user: User,
  ): Observable<UpdateResult> {
    return this.userService.updateRoleOfUser(Number(id), user);
  }
}
