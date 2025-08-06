import {Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from '../entities/doctor.entity';
import { User } from '../entities/user.entity';
import { Availability } from '../entities/availability.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Doctor, Availability]),
    ],
    controllers: [DoctorController],
    providers: [DoctorService],
})
export class DoctorModule {}