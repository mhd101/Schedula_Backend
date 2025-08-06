export class DoctorResponseDto {
    id: number;
    experience: number;
    specialization: string;
    education: string;
    contact_phone: string;
    created_at: Date;
    updated_at: Date;
    user: {
        user_id: number;
        name: string;
        email: string;
        role: string;
        created_at: Date;
        updated_at: Date;
    }
}