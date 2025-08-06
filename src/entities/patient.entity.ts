import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Patient {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    age: string;

    @Column()
    gender: string;

    @Column()
    contact: string;

    @Column()
    address: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToOne(() => User, user => user.patientProfile)
    @JoinColumn({ name: "user_id" })
    user: User;

}