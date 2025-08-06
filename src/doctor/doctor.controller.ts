import {
    Controller,
    Get,
    Param,
    Patch,
    Body,
    UseGuards,
    ParseIntPipe,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { DoctorService } from './doctor.service';
import { DoctorResponseDto } from './dto/doctor-response.dto';
import { DoctorUpdateInput } from './dto/Doctor-update-input.dto';

@Controller('api/doctors')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) { }

    // Only patients can access this endpoint
    // This endpoint retrieves all doctors
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PATIENT)
    @Get()
    async getAllDoctors(): Promise<DoctorResponseDto[]> {
        return this.doctorService.findAllDoctors();
    }

    // Only doctors and patients can access this endpoint
    // This endpoint retrieves a doctor by their ID
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR, Role.PATIENT)
    @Get(':id')
    async getDoctorById(@Param('id', ParseIntPipe) id: number): Promise<DoctorResponseDto> {
        return this.doctorService.findDoctorById(id);
    }

    // Only doctors can access this endpoint
    // This endpoint updates a doctor's profile
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DOCTOR)
    @Patch(':id')
    async updateDoctorProfile(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: DoctorUpdateInput,
        @Req() req: any // get the authenticated user from the request
    ): Promise<{ message: string; data: DoctorResponseDto }> {
        const authenticatedUserId = req.user.user_id;
        return this.doctorService.updateDoctorProfile(+id, updateData, authenticatedUserId);
    }

}