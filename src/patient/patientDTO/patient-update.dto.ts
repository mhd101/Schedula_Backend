import { IsNotEmpty, IsNumber, IsOptional, IsString, Length } from "class-validator";

export class PatientUpdateDto {
    @IsOptional()
    @IsNumber()
    @IsNotEmpty({ message: 'Age cannot be empty'})
    age?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty( {message: "Gender cannot be empty"})
    gender?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Contact cannot be empty' })
    contact?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Address cannot be empty' })
    address?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Name cannot be empty' })
    @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
    name?: string;
}