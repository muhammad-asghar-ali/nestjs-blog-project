/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  catchError,
  from,
  map,
  Observable,
  pipe,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import {
  DeleteResult,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { UserEntity, UserRole } from './model/user.entity';
import { User } from './model/user.interface';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {}

  create(user: User): Observable<User> {
    return this.authService.hashPassword(user.password).pipe(
      switchMap((passwordHash: string) => {
        const newUser = new UserEntity();
        newUser.name = user.name;
        newUser.username = user.username;
        newUser.email = user.email;
        newUser.password = passwordHash;
        newUser.role = UserRole.USER;

        return from(this.userRepository.save(newUser)).pipe(
          map((user: User) => {
            const { password, ...result } = user;
            return result;
          }),
          catchError((err) => throwError(err)),
        );
      }),
    );
    // return from(this.userRepository.save(user));
  }

  findOne(id: number): Observable<User> {
    return from(this.userRepository.findOne(id as FindOneOptions)).pipe(
      map((user: User) => {
        const { password, ...result } = user;
        return result;
      }),
    );
  }

  findAll(): Observable<User[]> {
    return from(this.userRepository.find()).pipe(
      map((users: User[]) => {
        users.forEach((user) => {
          delete user.password;
        });
        return users;
      }),
    );
  }

  update(id: number, user: User): Observable<UpdateResult> {
    delete user.password;
    delete user.email;
    delete user.role;
    return from(this.userRepository.update(id, user));
  }

  delete(id: number): Observable<DeleteResult> {
    return from(this.userRepository.delete(id));
  }

  paginate(options: IPaginationOptions): Observable<Pagination<User>> {
    return from(paginate<User>(this.userRepository, options)).pipe(
      map((usersPaginable: Pagination<User>) => {
        usersPaginable.items.forEach((v) => {
          delete v.password;
        });
        return usersPaginable;
      }),
    );
  }

  updateRoleOfUser(id: number, user: User): Observable<UpdateResult> {
    delete user.password;
    delete user.email;
    return from(this.userRepository.update(id, user));
  }

  findByMail(email: string): Observable<User> {
    return from(this.userRepository.findOne(email as FindOneOptions));
  }

  login(user: User): Observable<string> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((user: User) => {
        if (user) {
          return this.authService
            .generateToken(user)
            .pipe(map((jwt: string) => jwt));
        } else {
          return 'Wrong Credentials';
        }
      }),
    );
  }

  validateUser(email: string, password: string): Observable<User> {
    return this.findByMail(email).pipe(
      switchMap((user: User) =>
        this.authService.comparePasswords(password, user.password).pipe(
          map((match: boolean) => {
            if (match) {
              const { password, ...result } = user;
              return result;
            } else {
              throw Error;
            }
          }),
        ),
      ),
    );
  }
}
