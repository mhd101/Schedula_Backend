import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { Patient } from './src/entities/patient.entity';
import { Doctor } from './src/entities/doctor.entity';
import { Availability } from './src/entities/availability.entity';
import { Slot } from './src/entities/slot.entity';
import { Appointment } from './src/entities/appointment.entity';
import { ElasticSchedule } from './src/entities/elastic-schedule.entity';


export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Doctor, Patient, Availability, Slot, Appointment, ElasticSchedule],
  migrations: ['src/migrations/*.ts'],
  synchronize: true, // Set to false in production
  logging: true,
});
