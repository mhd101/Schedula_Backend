import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Slot } from "./slot.entity";
import { Doctor } from "./doctor.entity";
import { Patient } from "./patient.entity";

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Slot, { nullable: true, onDelete: "SET NULL", eager: false })
    @JoinColumn({ name: "slot_id" })
    slot: Slot

    @ManyToOne(() => Doctor, { onDelete: "CASCADE" })
    @JoinColumn({ name: "doctor_id" })
    doctor: Doctor

    @ManyToOne(() => Patient, { onDelete: "CASCADE" })
    @JoinColumn({ name: "patient_id" })
    patient: Patient

    @Column({ type: "enum", enum: ["confirmed", "cancelled", "completed", "rescheduled", "pending"] })
    status: "confirmed" | "cancelled" | "completed" | "rescheduled" | "pending";

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

