import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Matches, Min, ValidateIf } from "class-validator";

export class AvailabilityRequestDto {
    @IsDateString()
    date: string;

    @IsEnum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
    weekday: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'start_time must be in HH:mm format' })
    start_time: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'end_time must be in HH:mm format' })
    end_time: string;

    @IsEnum(["morning", "afternoon", "evening"], { message: "session should be morning, afternoon and evening" })
    session: "morning" | "afternoon" | "evening";

    @IsEnum(["stream", "wave"], { message: "mode should be stream or wave" })
    mode: "stream" | "wave";

    @ValidateIf(o => o.mode === "wave", )
    @IsInt()
    @Min(1, { message: 'maxBookings must be atleast 1' })
    @IsNotEmpty({message: "maxBooking is required for wave mode"})
    maxBookings?: number;

    @IsNumber()
    @Min(10, {message: 'Minimum slot duration is 10 minutes'})
    @IsNotEmpty({message: 'slotDuration is required'})
    slotDuration?: number

    @IsBoolean()
    @IsNotEmpty({message: 'isAvailable is required for creating availability'})
    isAvailable: boolean;
}