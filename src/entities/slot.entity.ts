import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Availability } from "./availability.entity";
import { ElasticSchedule } from "./elastic-schedule.entity";

@Entity()
export class Slot {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Availability, (availability) => availability.slots, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'availability_id' })
    availability: Availability;

    @ManyToOne(() => ElasticSchedule, (elastic) => elastic.slots, {nullable: true})
    elasticSchedule: ElasticSchedule;

    @Column({ nullable: true })
    isElastic: boolean;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'time' })
    start_time: string;

    @Column({ type: 'time' })
    end_time: string;

    // used in wave mode
    @Column({ type: 'int', default: 0, nullable: true })
    bookingCount: number | null

    @Column({ type: "enum", enum: ["stream", "wave"], nullable: true })
    mode: 'stream' | 'wave';

    @Column({ nullable: true })
    isBooked: boolean;
}