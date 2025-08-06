import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { Doctor } from "./doctor.entity";
import { Slot } from "./slot.entity";

@Entity()
export class Availability {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "date" })
    date: string;

    @Column({ type: 'enum', enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] })
    weekday: string;

    @Column({ type: "time" })
    start_time: string;

    @Column({ type: "time" })
    end_time: string;

    @Column({ type: "enum", enum: ["morning", "afternoon", "evening"] })
    session: 'morning' | 'afternoon' | 'evening';

    @Column({ type: "enum", enum: ["stream", "wave"] })
    mode: 'stream' | 'wave';

    @Column({ type: "int", default: 1, nullable: true })
    maxBookings?: number; // Optional, only for wave mode

    @Column()
    isAvailable: boolean;

    @Column({type: 'integer', nullable: true})
    slotDuration: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'doctor_id' })
    doctor: Doctor;

    @OneToMany(() => Slot, (slot) => slot.availability, { cascade: true })
    slots: Slot[];
}