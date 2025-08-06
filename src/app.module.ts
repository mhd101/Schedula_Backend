import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Patient } from './entities/patient.entity';
import { Doctor } from './entities/doctor.entity';
import 'dotenv/config';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { Availability } from './entities/availability.entity';
import { AvailabilityModule } from './availability/availability.module';
import { Slot } from './entities/slot.entity';
import { Appointment } from './entities/appointment.entity';
import { AppointmentModule } from './appointment/appointment.module';
import { ElasticSchedule } from './entities/elastic-schedule.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Doctor, Patient, Availability, Slot, Appointment, ElasticSchedule],
      synchronize: false, // Always false in production
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false,
      logging: true,
    }),
    AuthModule,
    DoctorModule,
    PatientModule,
    AvailabilityModule,
    AppointmentModule,
    TypeOrmModule.forFeature([User, Doctor, Patient, Availability, Slot, Appointment, ElasticSchedule])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
