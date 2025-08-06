import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Slot } from "./slot.entity";

@Entity()
export class ElasticSchedule {
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

    @Column({ type: "int", nullable: true })
    maxBookings?: number; // Optional, only for wave mode

    @Column()
    isAvailable: boolean;

    @Column({type: 'integer', nullable: true})
    slotDuration: number;

    @OneToMany(() => Slot, slot => slot.elasticSchedule)
    slots: Slot[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}