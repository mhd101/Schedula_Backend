import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Role } from "src/users/role.enum";
import { PatientService } from "./patient.service";
import { PatientResponseDto } from "./patientDTO/patient-response.dto";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from "@nestjs/common";
import { PatientUpdateDto } from "./patientDTO/patient-update.dto";


@Controller('api/patients')
export class PatientController {
    constructor(private readonly patientService: PatientService) { }

    // Only patients and doctors can access this endpoint
    // This endpoint retrieves a patient by their ID
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT, Role.DOCTOR)
    @Get(':id')
    async getPatientByid(@Param('id', ParseIntPipe) id: number): Promise<{
        message: string;
        data: PatientResponseDto;
    }> 
    {
        return this.patientService.getPatientById(id)
    }


    // Only patients can access this endpoint
    // This endpoint updates a patient's profile
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Patch(':id')
    async updatePatientProfile(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: PatientUpdateDto,
        @Req() req: any // get the authenticated user from the request
    ): Promise<{message: string; data: PatientUpdateDto}> {
        const authenticatedUserId = req.user.user_id;
        return this.patientService.updatePatientProfile(+id, updateData, 
        authenticatedUserId)
    }

}