import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./user.entity";
import { Availability } from "./availability.entity";

@Entity()
export class Doctor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    experience: string;

    @Column()
    education: string;

    @Column()
    specialization: string; 

    @Column()
    contact_phone: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToOne(() => User, user => user.doctorProfile)
    @JoinColumn({ name: "user_id" })
    user: User;

    @OneToMany(() => Availability, (availability) => availability.doctor)
    availabilities: Availability[];
}