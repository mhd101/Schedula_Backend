export class PatientResponseDto {
    id: number;
    age: number;
    gender: string;
    contact: string;
    address: string;
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