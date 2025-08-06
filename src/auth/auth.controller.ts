import { Body, Controller, BadRequestException, Post, UseGuards, Get, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Role } from "../users/role.enum";
import { AuthGuard } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { Repository } from "typeorm";


@Controller('/api')
export class AuthController {
    constructor(private readonly authService: AuthService,
        @InjectRepository(User) private userRepo: Repository<User>
    ) { }

    // Register a patient
    @Post('/auth/patient/register')
    async registerPatient(
        @Body()
        body: {
            name?: string;
            email?: string;
            password?: string;
            confirmPassword?: string,
        } = {},
    ) {
        const { name, email, password, confirmPassword } = body;

        // required fields validation
        if (!name || !email || !password || !confirmPassword) {
            throw new BadRequestException("All fields are required");
        }

        // email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new BadRequestException("Invalid email format");
        }

        // password length validation
        if (password.length < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        // password validation
        if (password !== confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        return this.authService.registerPatient(body);
    }

    // Register a doctor
    @Post('/auth/doctor/register')
    async registerDoctor(
        @Body()
        body: {
            name?: string;
            email?: string;
            password?: string;
            confirmPassword?: string,
        } = {},
    ) {
        const { name, email, password, confirmPassword } = body;

        // required fields validation
        if (!name || !email || !password || !confirmPassword) {
            throw new BadRequestException("All fields are required");
        }

        // email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new BadRequestException("Invalid email format");
        }

        // password length validation
        if (password.length < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        // password validation
        if (password !== confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        return this.authService.registerDoctor(body);
    }


    // Login for both patients and doctors
    @Post('/auth/login')
    async login(
        @Body()
        body: {
            email?: string;
            password?: string;
        } = {},
    ) {
        const { email, password } = body;

        // fields validation
        if (!email?.trim() || !password?.trim()) {
            throw new BadRequestException('Email and password are required');
        }

        // validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new BadRequestException("Invalid email format");
        }

        return this.authService.signin(email, password);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/profile')
    async getProfile(@Req() req) {
        const userId = req.user.user_id;
        const role = req.user.role;

        if (role === Role.PATIENT) {
            const user = await this.userRepo.findOne({
                where: { user_id: userId },
                relations: ['patientProfile'],
            });

            if (!user || !user.patientProfile) {
                throw new BadRequestException("Patient profile not found");
            }

            const patient = user.patientProfile;

            return {
                message: "Profile fetched successfully",
                data: {
                    patient: {
                        id: patient.id,
                        name: user.name,
                        age: patient.age,
                        gender: patient.gender,
                        contact: patient.contact,
                        address: patient.address,
                        email: user.email,
                        role: user.role,
                        created_at: patient.created_at,
                        updated_at: patient.updated_at,
                    },
                },
            };
        }
        
        if (role === Role.DOCTOR) {  
            const user = await this.userRepo.findOne({
                where: { user_id: userId },
                relations: ['doctorProfile'],
            });

            if (!user || !user.doctorProfile) {
                throw new BadRequestException("Doctor profile not found");
            }

            const doctor = user.doctorProfile;

            return {
                message: "Profile fetched successfully",
                data: {
                    doctor: {
                        id: doctor.id,
                        name: user.name,
                        experience: doctor.experience,
                        education: doctor.education,
                        specialization: doctor.specialization,
                        contact_phone: doctor.contact_phone,
                        email: user.email,
                        role: user.role,
                        created_at: doctor.created_at,
                        updated_at: doctor.updated_at,
                    },
                },
            };
        }

        throw new BadRequestException("Invalid role or user");
    }


}