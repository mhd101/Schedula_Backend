import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";
import { User } from "src/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Doctor } from "src/entities/doctor.entity";
import { Patient } from "src/entities/patient.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Doctor, Patient]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' } // token expiration time
        })
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [ JwtModule, JwtStrategy], // Export JwtStrategy for use in other modules
})
export class AuthModule {}
