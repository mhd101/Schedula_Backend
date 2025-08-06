import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/entities/user.entity";
import { Role } from "../users/role.enum";
import { Doctor } from "src/entities/doctor.entity";
import { Patient } from "src/entities/patient.entity";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
        private jwtService: JwtService,
    ) { }

    // Register Doctor
    async registerDoctor(body: any) {

        const { name, experience, education, specialization, contact_phone, email, password, confirmPassword } = body;

        if (!name || !email || !password || !confirmPassword || !experience || !education || !specialization || !contact_phone) {
            throw new BadRequestException("All fields are required");
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new BadRequestException("Invalid email format");
        }

        // Password length validation
        if (password.length < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        // Password validation
        if (password !== confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check if the user already exists
        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException("Email already registered");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const user = this.userRepo.create({
            name,
            email,
            password: hashedPassword,
            role: Role.DOCTOR,
        })
        await this.userRepo.save(user);

        const doctor = this.doctorRepo.create({
            experience,
            education,
            specialization,
            contact_phone,
            user,
        })
        await this.doctorRepo.save(doctor);

        return { message: `Doctor registered successfully`};
    }

    // Register Patient
    async registerPatient(body: any) {


        const { name, age, gender, contact, address, email, password, confirmPassword } = body;

        // Required fields validation
        if (!name || !email || !password || !confirmPassword || !age || !gender || !contact || !address) {
            throw new BadRequestException("All fields are required");
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new BadRequestException("Invalid email format");
        }

        // Password length validation
        if (password.length < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        // Password validation
        if (password !== confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check if the user already exists
        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException("Email already registered");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const user = this.userRepo.create({
            name,
            email,
            password: hashedPassword,
            role: Role.PATIENT,
        })
        await this.userRepo.save(user);

        const patient = this.patientRepo.create({
            age,
            gender,
            contact,
            address,
            user,
        })
        await this.patientRepo.save(patient);

        return { message: `Patient registered successfully` };
    }

    // Sign in a user (patient or doctor)
    async signin(email: string, password: string) {

        if (!email?.trim() || !password?.trim()) {
            throw new BadRequestException('Email and password are required');
        }

        const user = await this.userRepo.findOne({ where: { email }, relations: ['patientProfile', 'doctorProfile'] });

        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const payload = { sub: user.user_id, email: user.email, role: user.role };
        const token = this.jwtService.sign(payload);

        if (user.role === Role.PATIENT && user.patientProfile) {
            const patient = user.patientProfile

            return {
                message: "Successfully login as Patient",
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
                    }
                },
                accessToken: token
            }
        } 
        
        if (user.role === Role.DOCTOR && user.doctorProfile) {
            const doctor = user.doctorProfile

            return {
                message: "Successfully login as Doctor",
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
                    }
                },
                accessToken: token
            }
        } 

        throw new UnauthorizedException('Profile not found');
    }
}