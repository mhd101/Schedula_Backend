import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Availability } from "src/entities/availability.entity";
import { Doctor } from "src/entities/doctor.entity";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";
import { Slot } from "src/entities/slot.entity";
import { Appointment } from "src/entities/appointment.entity";


@Module({
    imports: [
        TypeOrmModule.forFeature([Availability, Doctor, Slot, Appointment])],
    controllers: [AvailabilityController],
    providers: [AvailabilityService],
    
})
export class AvailabilityModule {}