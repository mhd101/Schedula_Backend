import { IsInt } from "class-validator";

export class CreateAppointmentDto {

    @IsInt()
    doctorId: number;

    @IsInt()
    slotId: number;

}