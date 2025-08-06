import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Role } from "src/users/role.enum";
import { AppointmentService } from "./appointment.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";

@Controller("api/appointments")
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Post()
    async create(
        @Body() dto: CreateAppointmentDto,
        @Req() req: any
    ) {
        const userId = req.user.user_id
        return this.appointmentService.createAppointment(dto, userId)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Patch(':id/reschedule')
    async update(
        @Param('id') id: number,
        @Body('slotId') slotId: number,
        @Req() req: any
    ) {
        const userId = req.user.user_id
        return this.appointmentService.updateAppointment(+id, slotId, userId)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Delete(":id")
    async delete(
        @Param("id", ParseIntPipe) appointmentId: number,
        @Req() req: any
    ) {
        const userId = req.user.user_id
        return this.appointmentService.deleteAppointment(appointmentId, userId)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Get("/patients/:id")
    async getAppointmentByPatient(
        @Param('id', ParseIntPipe) patientId: number,
        @Req() req: any,
    ){
        const userId = req.user.user_id
        return this.appointmentService.getAppointmentsByPatient(patientId, userId)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR)
    @Get("/doctors/:id")
    async getAppointmentByDoctor(
        @Param('id', ParseIntPipe) doctorId: number,
        @Req() req: any,
    ){
        const userId = req.user.user_id
        return this.appointmentService.getAppointmentByDoctor(doctorId, userId)
    }

}
