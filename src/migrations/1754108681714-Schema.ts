import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1754108681714 implements MigrationInterface {
    name = 'Schema1754108681714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."appointment_status_enum" RENAME TO "appointment_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('confirmed', 'cancelled', 'completed', 'rescheduled', 'pending')`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "status" TYPE "public"."appointment_status_enum" USING "status"::"text"::"public"."appointment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum_old" AS ENUM('confirmed', 'cancelled', 'completed', 'rescheduled')`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "status" TYPE "public"."appointment_status_enum_old" USING "status"::"text"::"public"."appointment_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."appointment_status_enum_old" RENAME TO "appointment_status_enum"`);
    }

}
