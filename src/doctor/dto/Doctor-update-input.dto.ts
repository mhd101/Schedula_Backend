
import { IsOptional, IsString, IsNotEmpty, Min, Max, Length, Matches } from 'class-validator';

export class DoctorUpdateInput {

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Name cannot be empty' })
    @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Education cannot be empty' })
    @Length(2, 100, { message: 'Education must be between 2 and 100 characters' })
    education?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Specialization cannot be empty' })
    @Length(2, 100, { message: 'Specialization must be between 2 and 100 characters' })
    specialization?: string;

    @IsOptional()
    @IsString() // need to fix when file migration is done(future)
    experience?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Contact phone cannot be empty' })
    @Matches(/^[0-9]{10,15}$/, {
        message: 'Contact phone must be between 10 to 15 digits',
    })
    contact_phone?: string;
}

