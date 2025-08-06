import { Role } from "../users/role.enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { Patient } from "./patient.entity";
import { Doctor } from "./doctor.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    user_id: number;

    @Column()
    name: string;

    @Column({unique: true})
    email: string;

    @Column()
    password: string;

    @Column({type: "enum", enum: Role,})
    role: string; 

    @OneToOne(() => Patient, patient => patient.user)
    patientProfile: Patient;

    @OneToOne(() => Doctor, doctor => doctor.user)
    doctorProfile: Doctor;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

}