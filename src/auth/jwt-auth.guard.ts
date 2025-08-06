import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    // This guard uses the JWT strategy to authenticate requests
    // It will automatically handle the extraction of the JWT from the request
    // and validate it using the JwtStrategy defined in jwt.strategy.ts
}   