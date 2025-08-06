import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Appointment } from "src/entities/appointment.entity";
import { Doctor } from "src/entities/doctor.entity";
import { Patient } from "src/entities/patient.entity";
import { Slot } from "src/entities/slot.entity";
import { Repository } from "typeorm";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";


@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private appointmentRepo: Repository<Appointment>,
        @InjectRepository(Slot)
        private slotRepo: Repository<Slot>,
        @InjectRepository(Doctor)
        private doctorRepo: Repository<Doctor>,
        @InjectRepository(Patient)
        private patientRepo: Repository<Patient>,

    ) {}

    // This function creates appointments for patients
    async createAppointment(dto: CreateAppointmentDto, userId: number) {
        const { doctorId, slotId } = dto;

        const slot = await this.slotRepo.findOne({
            where: { id: slotId },
            relations: ['availability']
        })

        if (!slot) throw new NotFoundException("Slot not found")

        const doctor = await this.doctorRepo.findOne({
            where: { id: doctorId },
            relations: ['user']
        })

        if (!doctor) throw new NotFoundException("Doctor not found")

        const patient = await this.patientRepo.findOne({
            where: { user: { user_id: userId } },
            relations: ['user']
        })

        if (!patient) throw new NotFoundException("Patient not found")

        // Default bookingCount to 0 if null
        slot.bookingCount = slot.bookingCount ?? 0
        
        if (slot.availability.mode === 'stream') {
            if (slot.isBooked) throw new ConflictException("Slot already booked")
                slot.bookingCount = 1; 
            slot.isBooked = true; // marked as booked
            slot.mode = 'stream'
        }


        if (slot.availability.mode === 'wave') {
            const maxBookings = slot.availability.maxBookings ?? 0;
            if (slot.bookingCount >= maxBookings) {
                throw new ConflictException("Slot already booked")
            }
            slot.bookingCount += 1 // increment booking count
            slot.mode = 'wave'
            slot.isBooked = true;
        }

        await this.slotRepo.save(slot)

        const appointment = this.appointmentRepo.create({
            doctor,
            patient,
            slot,
            status: "confirmed"
        })

        await this.appointmentRepo.save(appointment)

        return {
            message: "Appointment booked successfully",
            data: {
                appointmentId: appointment.id,
                patientId: patient.id,
                doctorId: doctor.id,
                appointmentDetails: {
                    appointment_mode: slot.mode,
                    appointment_date: slot.availability.date,
                    appointment_day: slot.availability.weekday,
                    appointment_session: slot.availability.session,
                    appointment_start_time: slot.start_time,
                    appointment_end_time: slot.end_time,
                    appointment_status: appointment.status,
                    doctor_name: appointment.doctor.user.name,
                    patient_name: appointment.patient.user.name,
                    patient_age: patient.age,
                    patient_gender: patient.gender,
                    patient_contact: patient.contact
                }
            }
        }
    }

    // This function update the appointment using appointmentId
    async updateAppointment(
        appointmentId: number,
        slotId: number,
        userId: number) {
        const appointment = await this.appointmentRepo.findOne({
            where: { id: appointmentId },
            relations: ['slot', 'patient', 'patient.user']
        })

        if (!appointment) throw new NotFoundException("Appointment not found")

        if (appointment.patient.user.user_id !== userId) throw new ForbiddenException("You can only update your own appointments")

        const oldSlot = appointment.slot

        // if slot is to be updated
        if (slotId) {
            const newSlot = await this.slotRepo.findOne({
                where: { id: slotId },
                relations: ['availability']
            })

            if (!newSlot) throw new NotFoundException("Slot not found")

            newSlot.bookingCount = newSlot.bookingCount ?? 0
            oldSlot.bookingCount = oldSlot.bookingCount ?? 0

            if (newSlot.isBooked === true) throw new ConflictException("Slot already booked")
            newSlot.bookingCount = 1; 
            newSlot.isBooked = true; // marked as booked

            if (oldSlot && oldSlot.id !== newSlot.id && oldSlot.bookingCount > 0 && oldSlot.isBooked) {
                oldSlot.bookingCount -= 1; // free previous slot
                oldSlot.isBooked = false;
                await this.slotRepo.save(oldSlot)
            }

            await this.slotRepo.save(newSlot)

            appointment.slot = newSlot // assign new slot to appointment

            await this.appointmentRepo.save(appointment)

            return {
                message: "Appointment updated successfully"
            }
        }
    }

    // This function allow you to delete your own appointments
    async deleteAppointment(
        appointmentId: number,
        userId: number
    ) {
        const appointment = await this.appointmentRepo.findOne({
            where: { id: appointmentId },
            relations: ['slot', 'patient', 'patient.user', 'slot.availability']
        })
        if (!appointment) throw new NotFoundException("Appointment not found")

        if (appointment.patient.user.user_id !== userId) throw new UnauthorizedException("Unauthorized to delete the appointment")

        const slot = appointment.slot

        if (slot) {
            const mode = slot.mode
            slot.bookingCount = slot.bookingCount ?? 0
            if (mode === 'stream') {
                slot.bookingCount = 0;
                slot.isBooked = false;
            } else if (mode === 'wave') {
                slot.bookingCount = Math.max(0, slot.bookingCount - 1)
                if(slot.bookingCount === 0) 
                    slot.isBooked = false;
            }
            await this.slotRepo.save(slot)
        }

        await this.appointmentRepo.remove(appointment)

        return {
            message: "Appointment deleted successfully"
        }
    }

    // This function returns all the appointment related to specific patient
    async getAppointmentsByPatient(patientId: number, userId: number) {
        const patient = await this.patientRepo.findOne({
            where: { id: patientId },
            relations: ['user']
        })
        if (!patient) throw new NotFoundException("Patient not found")

        if (patient.user.user_id !== userId) throw new ForbiddenException("Access denied")

        const appointments = await this.appointmentRepo.find({
            where: {
                patient: { id: patientId }
            },
            relations: ['slot', 'doctor', 'slot.availability', 'doctor.user', 'patient.user']
        })
        return {
            message: "Appointment fetched successfully",
            data: appointments.map(appointment => {
                return {
                    appointmentId: appointment.id,
                    patientId: patient.id,
                    doctorId: appointment.doctor.id,
                    appointmentDetails: {
                        appointment_mode: appointment.slot?.mode,
                        appointment_date: appointment.slot?.availability.date,
                        appointment_day: appointment.slot?.availability.weekday,
                        appointment_session: appointment.slot?.availability.session,
                        appointment_start_time: appointment.slot?.start_time,
                        appointment_end_time: appointment.slot?.end_time,
                        appointment_status: appointment.status,
                        doctor_name: appointment.doctor.user.name,
                        patient_name: appointment.patient.user.name,
                        patient_age: patient.age,
                        patient_gender: patient.gender,
                        patient_contact: patient.contact,
                    }
                }
            })
        }
    }

    // This function returns all the appointment assigned to specific doctor
    async getAppointmentByDoctor(doctorId: number, userId: number) {
        const doctor = await this.doctorRepo.findOne({
            where: { id: doctorId },
            relations: ['user']
        })
        if (!doctor) throw new NotFoundException("Doctor not found")

        if (doctor.user.user_id !== userId) throw new ForbiddenException("Access denied")

        const appointments = await this.appointmentRepo.find({
            where: {
                doctor: { id: doctorId }
            },
            relations: ['slot', 'patient', 'slot.availability', 'doctor.user', 'patient.user']
        })
        return {
            message: "Appointment fetched successfully",
            data: appointments.map(appointment => {
                return {
                    appointmentId: appointment.id,
                    patientId: appointment.patient.id,
                    doctorId: appointment.doctor.id,
                    appointmentDetails: {
                        appointment_mode: appointment.slot.mode,
                        appointment_date: appointment.slot.availability.date,
                        appointment_day: appointment.slot.availability.weekday,
                        appointment_session: appointment.slot.availability.session,
                        appointment_start_time: appointment.slot.start_time,
                        appointment_end_time: appointment.slot.end_time,
                        appointment_status: appointment.status,
                        doctor_name: appointment.doctor.user.name,
                        patient_name: appointment.patient.user.name,
                        patient_age: appointment.patient.age,
                        patient_gender: appointment.patient.gender,
                        patient_contact: appointment.patient.contact
                    }
                }
            })
        }
    }
}