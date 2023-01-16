import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable, of } from 'rxjs';
import { User } from 'src/user/model/user.interface';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /** the rxjs "from" turns an array, promise, or terable into an observable */
  generateToken(user: User): Observable<string> {
    return from(this.jwtService.signAsync({ user }));
  }

  hashPassword(password: string): Observable<string> {
    return from<string>(bcrypt.hash(password, 12));
  }

  comparePasswords(
    newPassword: string,
    hashPassword: string,
  ): Observable<any | boolean> {
    return of<any | boolean>(bcrypt.compare(newPassword, hashPassword));
  }
}
