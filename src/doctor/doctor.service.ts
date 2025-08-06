import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { User } from '../entities/user.entity';
import { DoctorResponseDto } from './dto/doctor-response.dto';
import { DoctorUpdateInput } from './dto/Doctor-update-input.dto';


export class DoctorService {
    constructor(
        @InjectRepository(Doctor)
        private doctorRepo: Repository<Doctor>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }


    // This method retrieves all doctors
    async findAllDoctors(): Promise<DoctorResponseDto[]> {

        const doctors = await this.doctorRepo.find({
            relations: ['user']
        })

        if (!doctors || doctors.length === 0) {
            throw new NotFoundException('No doctors found');
        }

        return doctors.map(doctor => {
            const dto: DoctorResponseDto = {
                id: doctor.id,
                experience: parseInt(doctor.experience),
                specialization: doctor.specialization,
                education: doctor.education,
                contact_phone: doctor.contact_phone,
                created_at: doctor.created_at,
                updated_at: doctor.updated_at,
                user: {
                    user_id: doctor.user.user_id,
                    name: doctor.user.name,
                    email: doctor.user.email,
                    role: doctor.user.role,
                    created_at: doctor.user.created_at,
                    updated_at: doctor.user.updated_at
                }
            }
            return dto;
        });
    }

    // This method retrieves a doctor by their ID
    async findDoctorById(id: number): Promise<DoctorResponseDto> {
        const doctor = await this.doctorRepo.findOne({
            where: { id: Number(id) },
            relations: ['user']
        })

        if (!doctor) {
            throw new NotFoundException(`Doctor doesn't exist`);
        }

        const dto: DoctorResponseDto = {
            id: doctor.id,
            experience: parseInt(doctor.experience),
            specialization: doctor.specialization,
            education: doctor.education,
            contact_phone: doctor.contact_phone,
            created_at: doctor.created_at,
            updated_at: doctor.updated_at,
            user: {
                user_id: doctor.user.user_id,
                name: doctor.user.name,
                email: doctor.user.email,
                role: doctor.user.role,
                created_at: doctor.user.created_at,
                updated_at: doctor.user.updated_at
            }
        }

        return dto;

    }

    // This method updates a doctor's profile
    async updateDoctorProfile(
        id: number,
        updateData: DoctorUpdateInput,
        authenticatedUserId: number
    ): Promise<{ message: string; data: DoctorResponseDto }> {
        const doctor = await this.doctorRepo.findOne({
            where: { id },
            relations: ['user']
        });

        if (!doctor) {
            throw new NotFoundException(`Doctor doesn't exist`);
        }

        if (doctor.user.user_id !== authenticatedUserId) {
            throw new UnauthorizedException('You are not authorized to update this doctor profile');
        }
        
        const { experience, specialization, education, contact_phone, name } = updateData;

        // Check if at least one field is provided
        const hasUpdates = [experience, specialization, education, contact_phone, name].some(
            (field) => typeof field !== 'undefined'
        );

        if (!hasUpdates) {
            throw new BadRequestException('At least one field must be provided to update');
        }

        // Update doctor fields if provided
        if (experience !== undefined) doctor.experience = experience;
        if (specialization !== undefined) doctor.specialization = specialization;
        if (education !== undefined) doctor.education = education;
        if (contact_phone !== undefined) doctor.contact_phone = contact_phone;

        // Update nested user name if provided
        if (name !== undefined) {
            doctor.user.name = name;
            await this.userRepo.save(doctor.user);
        }

        const updatedDoctor = await this.doctorRepo.save(doctor);

        const dto: DoctorResponseDto = {
            id: updatedDoctor.id,
            experience: parseInt(updatedDoctor.experience),
            specialization: updatedDoctor.specialization,
            education: updatedDoctor.education,
            contact_phone: updatedDoctor.contact_phone,
            created_at: updatedDoctor.created_at,
            updated_at: updatedDoctor.updated_at,
            user: {
                user_id: updatedDoctor.user.user_id,
                name: updatedDoctor.user.name,
                email: updatedDoctor.user.email,
                role: updatedDoctor.user.role,
                created_at: updatedDoctor.user.created_at,
                updated_at: updatedDoctor.user.updated_at
            }
        };

        return {
            message: 'Doctor profile updated successfully',
            data: dto
        };
    }


}
