import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {PatientController} from "./patient.controller";
import {PatientService} from "./patient.service";
import {Patient} from "../entities/patient.entity";
import { User } from "../entities/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Patient]),
    ],
    controllers: [PatientController],
    providers: [PatientService],
})

export class PatientModule {}
