import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Appointment } from "src/entities/appointment.entity";
import { Availability } from "src/entities/availability.entity";
import { Doctor } from "src/entities/doctor.entity";
import { Patient } from "src/entities/patient.entity";
import { Slot } from "src/entities/slot.entity";
import { AppointmentService } from "./appointment.service";
import { AppointmentController } from "./appointment.controller";


@Module({
    imports: [
            TypeOrmModule.forFeature([Appointment, Doctor, Availability, Slot, Patient])],
        controllers: [AppointmentController],
        providers: [AppointmentService],
})

export class AppointmentModule {}