// ...existing imports...
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards, Patch, Req } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Availability } from "src/entities/availability.entity";
import { Role } from "src/users/role.enum";
import { AvailabilityRequestDto } from "./dto/availability-request.dto";
import { AvailabilityService } from "./availability.service";
import { updateAvailabilityDto } from "./dto/update-availability.dto";


@Controller("api/doctors")
export class AvailabilityController {
    constructor(private readonly availabilityService: AvailabilityService){}

    // This endpoint is used to get all available slots for specific doctors
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR, Role.PATIENT)

    @UseGuards(JwtAuthGuard)
    @Patch('availability/:id')
    async updateAvailability(
        @Req() req,
        @Param('id', ParseIntPipe) availabilityId: number,
        @Body() dto: updateAvailabilityDto
    ) {
        // Assuming req.user.id is the doctor's id
        const doctorId = req.user.user_id;
        console.log(doctorId)
        return await this.availabilityService.updateAvailability(doctorId, availabilityId, dto);
    }

    @Get(":id/slots")
    getSlots(
        @Param("id", ParseIntPipe) doctorId: number
    ){
        return this.availabilityService.getSlots(doctorId)
    }

    // This endpoint allows doctor to create availability and create slots based on mode: stream | wave
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR)
    @Post(":id/slots")
    createAvailability(
        @Param("id", ParseIntPipe) doctorId: number,
        @Body() dto: AvailabilityRequestDto,
    ) {
        return this.availabilityService.createAvailability(doctorId, dto)
    }

    // This endpoint allows doctor to delete their available slots based on the slotId
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR)
    @Delete(":doctor_id/slots/:id")
    deleteSlots(
        @Param('doctor_id', ParseIntPipe) doctorId: number,
        @Param('id', ParseIntPipe) slotId: number,

    ){
        return this.availabilityService.deleteSlot(doctorId, slotId)
    }

}