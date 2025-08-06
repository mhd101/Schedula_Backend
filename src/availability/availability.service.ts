import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Availability } from "src/entities/availability.entity";
import { Doctor } from "src/entities/doctor.entity";
import { Repository } from "typeorm";
import { AvailabilityRequestDto } from "./dto/availability-request.dto";
import { Slot } from "src/entities/slot.entity";
import { DataSource } from "typeorm";
import { updateAvailabilityDto } from "./dto/update-availability.dto";
import { addDays, set } from 'date-fns'
import { ElasticSchedule } from "src/entities/elastic-schedule.entity";
import { Appointment } from "src/entities/appointment.entity";

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectRepository(Availability)
        private readonly availabilityRepo: Repository<Availability>,

        @InjectRepository(Doctor)
        private readonly doctorRepo: Repository<Doctor>,

        @InjectRepository(Slot)
        private readonly slotRepo: Repository<Slot>,

        private readonly dataSource: DataSource
    ) {}

    // function to retrieve next weekday occurences from the date of availability creation
    getNextWeekdayOccurences(startDate: Date, weekday: string, count: number): Date[] {
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(weekday.toLowerCase())
        const results: Date[] = [];
        let date = new Date(startDate)

        while (results.length < count) {
            if (date.getDay() === dayIndex) {
                results.push(new Date(date));
                date = addDays(date, 7);
            } else {
                date = addDays(date, 1);
            }
        }
        return results;
    }

    // Utility function to generate slots for availability
    generateSlots(availability: Availability, weeks = 4, slotDuration: number): Slot[] {
        const occurrences = this.getNextWeekdayOccurences(new Date(availability.date), availability.weekday, weeks);
        const slots: Slot[] = [];

        for (const date of occurrences) {
            const [startH, startM] = availability.start_time.split(':').map(Number);
            const [endH, endM] = availability.end_time.split(':').map(Number);

            const start = set(date, { hours: startH, minutes: startM, seconds: 0 })
            const end = set(date, { hours: endH, minutes: endM, seconds: 0 })

            let current = new Date(start)
            while (current < end) {
                const next = new Date(current.getTime() + slotDuration * 60 * 1000)
                if (next <= end) {
                    const slot = this.slotRepo.create({
                        date: date,
                        start_time: (new Date(current)).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        end_time: (new Date(next)).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        isBooked: false,
                        bookingCount: 0,
                        availability: availability
                    })
                    slots.push(slot)
                }
                current = next;
            }
        }
        return slots;
    }

    // function to create doctor availability and slots based on the mode: stream | wave
    async createAvailability(doctorId: number, dto: AvailabilityRequestDto): Promise<{ message: string, data: Availability }> {
        const doctor = await this.doctorRepo.findOne({
            where: { id: doctorId }
        })

        if (!doctor) {
            throw new NotFoundException("Doctor not found");
        }

        // Using transaction if slots are not created then it should rollback
        return await this.dataSource.transaction(async (manager) => {
            const availabilityRepo = manager.getRepository(Availability)
            const slotRepo = manager.getRepository(Slot)

            const existingAvailability = await this.availabilityRepo.find({
                where: {
                    doctor: { id: doctorId },
                    weekday: dto.weekday,
                    session: dto.session
                }
            })

            // checking for overlaping availabilities
            if (existingAvailability.length > 0) {
                const hasOverlap = existingAvailability.some(existing => {
                    const existingStart = new Date(`${dto.date}T${existing.start_time}`);
                    const existingEnd = new Date(`${dto.date}T${existing.end_time}`);
                    const newStart = new Date(`${dto.date}T${dto.start_time}`);
                    const newEnd = new Date(`${dto.date}T${dto.end_time}`);

                    return (newStart < existingEnd && newEnd > existingStart)
                })

                if (hasOverlap) {
                    throw new BadRequestException("Time overlap conflict with existing availability")
                }
            }

            const availability = availabilityRepo.create({
                ...dto,
                doctor
            })

            await availabilityRepo.save(availability)

            // creating slots for stream mode
            if (dto.mode === 'stream') {

                if (dto.maxBookings !== undefined || dto.maxBookings === null) {
                    throw new BadRequestException("maxBookings is not required in stream mode")
                }

                if (dto.slotDuration === undefined || dto.slotDuration === null) {
                    throw new BadRequestException("SlotDuration is required in stream mode")
                }

                const slots = this.generateSlots(availability, 4, dto.slotDuration ?? 0)
                slots.forEach(s => s.mode = 'stream');
                await manager.save(Slot, slots)

            } else if (dto.mode === 'wave') {

                if (dto.maxBookings === undefined || dto.maxBookings === null) {
                    throw new BadRequestException("maxBookings is required for wave mode")
                }

                if (dto.slotDuration === undefined || dto.slotDuration === null) {
                    throw new BadRequestException("slotDuration is required for wave mode") // act as waveDuration
                }

                const slots = this.generateSlots(availability, 4, dto.slotDuration ?? 0)
                slots.forEach(s => s.mode = 'wave')
                await manager.save(Slot, slots)
            }
            return {
                message: "Doctor availability created",
                data: availability
            };
        })

    }

    // function to retrieve available slots based on the doctor Id
    async getSlots(doctorId: number): Promise<{ message: string, slots: any[] }> {
        const slots = await this.slotRepo.find({
            where: {
                availability: {
                    doctor: { id: doctorId },
                    isAvailable: true,
                },
                isBooked: false // show only unbooked slots
            },
            order: { date: 'ASC', start_time: 'ASC' },
            relations: ['availability', 'availability.doctor'],

        })

        if (slots.length === 0) {
            throw new NotFoundException("No available slots found for this doctor")
        }

        const slot = slots.map((slot) => ({
            slot_id: slot.id,
            date: slot.date,
            weekday: slot.availability.weekday,
            session: slot.availability.session,
            slot_mode: slot.availability.mode,
            slot_maxBookings: slot.availability?.maxBookings,
            slot_BookingCount: slot.bookingCount,
            start_time: slot.start_time,
            end_time: slot.end_time,
            isBooked: slot.isBooked,
        }))

        return {
            message: "Available slots",
            slots: slot
        }
    }

    // function to delete slot using doctorId and slotId
    async deleteSlot(doctorId: number, slotId: number): Promise<{ message: string }> {
        const slot = await this.slotRepo.findOne({
            where: {
                id: slotId
            },
            relations: ['availability', 'availability.doctor']
        })

        if (!slot) {
            throw new NotFoundException("Slot not found")
        }

        if (slot.availability.doctor.id !== doctorId) {
            throw new UnauthorizedException("Doctor doesn't own this slot")
        }

        await this.slotRepo.delete(slotId)

        return {
            message: 'Slot deleted successfully'
        }
    }

    // function to update the availability and handle elastic scheduling
    async updateAvailability(doctorId: number, availabilityId: number, dto: updateAvailabilityDto) {
        return this.dataSource.transaction(async (manager) => {
            // fetch existing availability and validating
            const oldAvailability = await manager.findOne(Availability, {
                where: { id: availabilityId },
                relations: ['doctor', 'slots', 'doctor.user']
            })

            if (!oldAvailability) {
                throw new NotFoundException('Availability not found');
            }

            if (oldAvailability.doctor.user.user_id !== doctorId) {
                throw new UnauthorizedException("Doctor doesn't own this availability");
            }

            // restrict doctor to update availability less than 4 hours before start time
            const dateStr = oldAvailability.date.split('T')[0]
            const startDateTime = new Date(`${dateStr}T${oldAvailability.start_time}`)
            const nowPlus4Hours = new Date(Date.now() + 4 * 60 * 60 * 1000)

            if (startDateTime < nowPlus4Hours) {
                throw new ForbiddenException("You can't update availability less than 4 hours before start time")
            }

            // check for duplicates
            const existingElasticSchedule = await manager.findOne(ElasticSchedule, {
                where: {
                    date: oldAvailability.date,
                    weekday: oldAvailability.weekday,
                    start_time: dto.start_time,
                    end_time: dto.end_time
                }
            })

            if (existingElasticSchedule) {
                throw new BadRequestException("Elastic schedule already exist")
            }

            // create elastic schedule
            const elasticSchedule = manager.create(ElasticSchedule, {
                date: oldAvailability.date,
                weekday: oldAvailability.weekday,
                start_time: dto.start_time,
                end_time: dto.end_time,
                session: oldAvailability.session,
                mode: oldAvailability.mode,
                maxBookings: oldAvailability.maxBookings,
                isAvailable: oldAvailability.isAvailable,
                slotDuration: oldAvailability.slotDuration,
                isElastic: true,
                slots: oldAvailability.slots
            })
            await manager.save(elasticSchedule)

            const oldStart = new Date(`${dateStr}T${oldAvailability.start_time}`)
            const oldEnd = new Date(`${dateStr}T${oldAvailability.end_time}`)
            const newStart = new Date(`${dateStr}T${dto.start_time}`)
            const newEnd = new Date(`${dateStr}T${dto.end_time}`)

            // case 1: when elastic schedule lie outside the oldAvailability
            const isOutside = newEnd <= oldStart || newStart >= oldEnd

            // case 2: when elastic schedule is shrinked and lie inside the old availability
            const old_duration = oldEnd.getTime() - oldStart.getTime()
            const new_duration = newEnd.getTime() - newStart.getTime()
            const isShrinked = newStart >= oldStart && newEnd <= oldEnd && new_duration < old_duration

            // case 3: When elastic schedule is expanded from at the beginning or the end then new slot will be created that doesn't exist
            const isExpanded = newStart < oldStart || newEnd > oldEnd

            if (isOutside) {

                // handling previous availability
                oldAvailability.isAvailable = false;
                manager.save(Availability, oldAvailability)

                // create new slots for elastic schedule
                let current = new Date(`${oldAvailability.date}T${dto.start_time}`).getTime()
                const end = new Date(`${oldAvailability.date}T${dto.end_time}`).getTime()
                const slotDuration = oldAvailability.slotDuration * 60 * 1000;

                const elasticSlots: Slot[] = [];

                while (current < end) {
                    const slotStart = new Date(current);
                    const slotEnd = new Date(current + slotDuration)
                    const slot = manager.create(Slot, {
                        elasticSchedule: elasticSchedule,
                        date: elasticSchedule.date,
                        start_time: slotStart.toTimeString().slice(0, 8),
                        end_time: slotEnd.toTimeString().slice(0, 8),
                        bookingCount: 0,
                        isBooked: false,
                        isElastic: true,
                        mode: elasticSchedule.mode,
                        availability: oldAvailability
                    })
                    elasticSlots.push(slot)
                    current += slotDuration;
                }

                await manager.save(elasticSlots)

                // fetch previous slots 
                const prevSlots = oldAvailability.slots.filter(s => {
                    const dateCheck = new Date(oldAvailability.date).getTime() === new Date(s.date).getTime();
                    return dateCheck;
                })

                // delete previous slots
                prevSlots.forEach(s => {
                    manager.delete(Slot, s.id)
                })

                // find affected appointments
                const appointment = await this.dataSource.getRepository('Appointment').find({
                    where: {
                        doctor: doctorId,
                        status: 'confirmed'
                    },
                    relations: ['slot']
                })
                const baseDate = '2025-01-01';
                const invalidAppointments = appointment.filter(() => {
                    const slotTime = new Date(`${baseDate}T${oldAvailability.start_time}`).getTime();
                    return (
                        slotTime < new Date(`${baseDate}T${elasticSchedule.start_time}`).getTime() ||
                        slotTime >= new Date(`${baseDate}T${elasticSchedule.end_time}`).getTime()
                    );
                });

                elasticSlots.sort((a, b) => a.start_time.localeCompare(b.start_time))

                if (elasticSchedule.mode === 'wave') {
                    for (const appointment of invalidAppointments) {
                        // find the first slot with room left
                        const availableSlot = elasticSlots.find(slot => {
                            const maxBookings = slot.availability.maxBookings ?? 0
                            return (slot.bookingCount ?? 0) < maxBookings;
                        })

                        if (!availableSlot) {
                            throw new NotFoundException("No available wave slots to assign")
                        }

                        appointment.slot = availableSlot
                        appointment.status = 'rescheduled'

                        availableSlot.bookingCount = availableSlot.bookingCount ?? 0
                        availableSlot.bookingCount += 1


                        if (availableSlot.bookingCount >= (availableSlot.availability.maxBookings ?? 0)) {
                            availableSlot.isBooked = true
                        }

                        await manager.save(Slot, availableSlot)
                        await manager.save(Appointment, appointment)
                    }
                } else { // for mode 'stream'
                    for (let i = 0; i < invalidAppointments.length; i++) {
                        const appointment = invalidAppointments[i];
                        const availableSlot = elasticSlots.find(slot => !slot.isBooked)

                        if (!availableSlot) throw new NotFoundException("No available slots to assign")

                        appointment.slot = availableSlot;
                        appointment.status = 'rescheduled';
                        availableSlot.bookingCount = 1;
                        availableSlot.isBooked = true;

                        await manager.save(Slot, availableSlot)
                        await manager.save(Appointment, appointment)
                    }
                }

                return {
                    type: "New Schedule",
                    message: "New elastic schedule is created and affected appointment are rescheduled",
                }

            } else if (isShrinked) {

                // handling previous availability
                oldAvailability.isAvailable = false;
                manager.save(Availability, oldAvailability)

                // fetch appointments
                const appointment = await this.dataSource.getRepository('Appointment').find({
                    where: {
                        doctor: { id: doctorId },
                        status: 'confirmed'
                    },
                    relations: ['slot']
                })

                // find invalid appointments
                const baseDate = oldAvailability.date;
                const invalidAppointments = appointment.filter((app) => {
                    const appStartTime = new Date(`${baseDate}T${app.slot.start_time}`).getTime()
                    const appEndTime = new Date(`${baseDate}T${app.slot.end_time}`).getTime()
                    const elasticStartTime = new Date(`${baseDate}T${elasticSchedule.start_time}`).getTime()
                    const elasticEndTime = new Date(`${baseDate}T${elasticSchedule.end_time}`).getTime()
                    return appStartTime < elasticStartTime || appEndTime > elasticEndTime
                });

                // find invalid slots
                const invalidSlots = oldAvailability.slots.filter(s => {
                    const appStartTime = new Date(`${baseDate}T${s.start_time}`).getTime()
                    const appEndTime = new Date(`${baseDate}T${s.end_time}`).getTime()
                    const elasticStartTime = new Date(`${baseDate}T${elasticSchedule.start_time}`).getTime()
                    const elasticEndTime = new Date(`${baseDate}T${elasticSchedule.end_time}`).getTime()
                    return appStartTime < elasticStartTime || appEndTime > elasticEndTime
                }).filter(d => {
                    return new Date(d.date).toISOString().split('T')[0] === new Date(elasticSchedule.date).toISOString().split('T')[0];
                })

                // find unbooked slots for that day
                const slots = await this.slotRepo.find({
                    where: {
                        availability: {
                            doctor: { id: doctorId },
                            isAvailable: true,
                        },
                        isBooked: false,
                        date: new Date(elasticSchedule.date)
                    },
                    order: { start_time: 'ASC' },
                    relations: ['availability', 'availability.doctor'],

                })

                // delete invalid slots that are not booked 
                invalidSlots.forEach(slot => {
                    manager.delete(Slot, slot.id)
                })

                // delete the invalid Appointment slots
                invalidAppointments.forEach(app => {
                    manager.delete(Slot, app.slot.id)
                })

                // asign slots one by one to invalid appointments
                slots.sort((a, b) => a.start_time.localeCompare(b.start_time))
                if (elasticSchedule.mode === 'wave') {

                    for (const appointment of invalidAppointments) {

                        // find a slot that has room for the patients
                        const availableSlot = slots.find(slot => {
                            const maxBookings = slot.availability?.maxBookings ?? 0
                            const count = slot.bookingCount ?? 0
                            return count < maxBookings
                        })

                        if (!availableSlot) {
                            appointment.status = 'pending'
                            appointment.slot = null
                            await manager.save(Appointment, appointment)
                        } else {
                            // assign appointment to the slot
                            appointment.slot = availableSlot
                            appointment.status = 'rescheduled'

                            availableSlot.bookingCount = availableSlot.bookingCount ?? 0

                            availableSlot.bookingCount += 1

                            const maxBookings = availableSlot.availability.maxBookings ?? 0

                            if (availableSlot.bookingCount >= maxBookings) {
                                availableSlot.isBooked = true
                            }

                            await manager.save(Slot, availableSlot)
                            await manager.save(Appointment, appointment)
                        }
                    }
                    
                } else { // for mode 'stream'

                    for (let i = 0; i < invalidAppointments.length; i++) {
                        const appointment = invalidAppointments[i];
                        const availableSlot = slots.find(slot => !slot.isBooked)

                        if (availableSlot === undefined) {
                            appointment.status = 'pending'
                            appointment.slot = null
                            await manager.save(Appointment, appointment)
                            // notify the user that the appointment is cancelled.
                        } else {
                            appointment.slot = availableSlot;
                            appointment.status = 'rescheduled';
                            if (oldAvailability.mode === 'stream') {
                                availableSlot.bookingCount = 1;
                            } else {
                                availableSlot.bookingCount = availableSlot.bookingCount
                            }
                            availableSlot.isBooked = true;

                            await manager.save(Slot, availableSlot)
                            await manager.save(Appointment, appointment)
                        }
                    }
                }

                return {
                    type: "Scheduled Shrinked",
                    message: "New elastic schedule is created and affected appointment are rescheduled",
                }

            } else if (isExpanded) {

                // create new slots for elastic schedule
                let current = new Date(`${oldAvailability.date}T${dto.start_time}`).getTime()
                const end = new Date(`${oldAvailability.date}T${dto.end_time}`).getTime()
                const slotDuration = oldAvailability.slotDuration * 60 * 1000;

                const elasticSlots: Slot[] = [];

                // old overlaping slots
                const oldOverlapingSlots = oldAvailability.slots.map(s => {
                    const slot = {
                        slotId: s.id,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        date: s.date,
                    }
                    return slot;
                }).filter(slot => (slot.date).toString() === oldAvailability.date)

                // Using set to store unique slots
                const overLappingKeys = new Set(
                    oldOverlapingSlots.map(s => `${s.start_time}-${s.end_time}`)
                )

                // create new slots for expanded availability
                while (current < end) {
                    const slotStart = new Date(current);
                    const slotEnd = new Date(current + slotDuration)

                    const startStr = slotStart.toTimeString().slice(0, 8)
                    const endStr = slotEnd.toTimeString().slice(0, 8)
                    const key = `${startStr}-${endStr}`

                    if (overLappingKeys.has(key)) {
                        // console.log("Skipping: ", key)
                        current += slotDuration;
                    } else {
                        const slot = manager.create(Slot, {
                            elasticSchedule: elasticSchedule,
                            date: elasticSchedule.date,
                            start_time: slotStart.toTimeString().slice(0, 8),
                            end_time: slotEnd.toTimeString().slice(0, 8),
                            bookingCount: 0,
                            isBooked: false,
                            isElastic: true,
                            mode: elasticSchedule.mode,
                            availability: oldAvailability
                        })
                        elasticSlots.push(slot)
                        overLappingKeys.add(key)
                        current += slotDuration;
                    }
                }

                await manager.save(elasticSlots)

                // fetching elastic slots that are created
                const elasticSl = await manager.find(Slot, {
                    where: {
                        date: new Date(elasticSchedule.date),
                        isElastic: true
                    }
                })

                return {
                    type: "Scheduled Expanded",
                    message: "New elastic schedule is created and new slots will be created that doesn't exist",
                    elasticSlots: elasticSl
                }
            }

        });
    }
}