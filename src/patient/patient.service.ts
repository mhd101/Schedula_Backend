import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Patient } from "../entities/patient.entity";
import { User } from "../entities/user.entity";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PatientResponseDto } from "./patientDTO/patient-response.dto";
import { PatientUpdateDto } from "./patientDTO/patient-update.dto";


export class PatientService {
    constructor(
        @InjectRepository(Patient)
        private patientRepo: Repository<Patient>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ){}

    // This method retrieves a patient by their ID
    async getPatientById(id: number): Promise<{message: string,data: PatientResponseDto}> {
        const patient = await this.patientRepo.findOne({
            where: { id: Number(id)},
            relations: ['user']
        })

        if(!patient) {
            throw new NotFoundException(`Patient doesn't exist`);
        }

        const dto: PatientResponseDto = {
            id: patient.id,
            age: parseInt(patient.age),
            gender: patient.gender,
            contact: patient.contact,
            address: patient.address,
            created_at: patient.created_at,
            updated_at: patient.updated_at,
            user: {
                user_id: patient.user.user_id,
                name: patient.user.name,
                email: patient.user.email,
                role: patient.user.role,
                created_at: patient.user.created_at,
                updated_at: patient.user.updated_at
            }
        }
        return {
            message: 'Patient found successfully',
            data: dto
        };
        
    }

    // This method updates a patient's profile
    async updatePatientProfile(id: number, updateData: PatientUpdateDto,
        authenticatedUserId: number
    ): Promise<{message: string, data: PatientUpdateDto}> {
        const patient = await this.patientRepo.findOne({
            where: { id: Number(id) },
            relations: ['user']
        })

        if(!patient) {
            throw new NotFoundException("Patient doesn't exist");
        }

        if ( patient.user.user_id != authenticatedUserId) {
            throw new UnauthorizedException("You are not authorized to update this patient profile");
        }

        const { age, gender, contact, address, name } = updateData;

        const hasUpdates = [age, gender, contact, address, name].some((field) => typeof field !== 'undefined');

        if (!hasUpdates) {
            throw new UnauthorizedException("At least one field must be provided for update");
        }

        if ( age !== undefined) {
            patient.age = age.toString();
        }

        if (gender !== undefined) {
            patient.gender = gender;
        }

        if (contact !== undefined) {
            patient.contact = contact;
        }
        if (address !== undefined) {
            patient.address = address;
        }
        if (name !== undefined) {
            patient.user.name = name;
            await this.userRepo.save(patient.user);
        }

        const updatedPatient = await this.patientRepo.save(patient);

        const dto: PatientResponseDto = {
            id: updatedPatient.id,
            age: parseInt(updatedPatient.age),
            gender: updatedPatient.gender,
            contact: updatedPatient.contact,
            address: updatedPatient.address,
            created_at: updatedPatient.created_at,
            updated_at: updatedPatient.updated_at,
            user: {
                user_id: updatedPatient.user.user_id,
                name: updatedPatient.user.name,
                email: updatedPatient.user.email,
                role: updatedPatient.user.role,
                created_at: updatedPatient.user.created_at,
                updated_at: updatedPatient.user.updated_at
            }
        }

        return {
            message: 'Patient profile updated successfully',
            data: dto
        };

    }

}