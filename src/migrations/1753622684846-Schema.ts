import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1753622684846 implements MigrationInterface {
    name = 'Schema1753622684846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patient" ("id" SERIAL NOT NULL, "age" character varying NOT NULL, "gender" character varying NOT NULL, "contact" character varying NOT NULL, "address" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_f20f0bf6b734938c710e12c278" UNIQUE ("user_id"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."elastic_schedule_weekday_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`);
        await queryRunner.query(`CREATE TYPE "public"."elastic_schedule_session_enum" AS ENUM('morning', 'afternoon', 'evening')`);
        await queryRunner.query(`CREATE TYPE "public"."elastic_schedule_mode_enum" AS ENUM('stream', 'wave')`);
        await queryRunner.query(`CREATE TABLE "elastic_schedule" ("id" SERIAL NOT NULL, "date" date NOT NULL, "weekday" "public"."elastic_schedule_weekday_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "session" "public"."elastic_schedule_session_enum" NOT NULL, "mode" "public"."elastic_schedule_mode_enum" NOT NULL, "maxBookings" integer, "isAvailable" boolean NOT NULL, "slotDuration" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2bc91753379686e95f2e7ea0174" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."slot_mode_enum" AS ENUM('stream', 'wave')`);
        await queryRunner.query(`CREATE TABLE "slot" ("id" SERIAL NOT NULL, "isElastic" boolean, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "bookingCount" integer DEFAULT '0', "mode" "public"."slot_mode_enum", "isBooked" boolean, "availability_id" integer, "elasticScheduleId" integer, CONSTRAINT "PK_5b1f733c4ba831a51f3c114607b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."availability_weekday_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`);
        await queryRunner.query(`CREATE TYPE "public"."availability_session_enum" AS ENUM('morning', 'afternoon', 'evening')`);
        await queryRunner.query(`CREATE TYPE "public"."availability_mode_enum" AS ENUM('stream', 'wave')`);
        await queryRunner.query(`CREATE TABLE "availability" ("id" SERIAL NOT NULL, "date" date NOT NULL, "weekday" "public"."availability_weekday_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "session" "public"."availability_session_enum" NOT NULL, "mode" "public"."availability_mode_enum" NOT NULL, "maxBookings" integer, "isAvailable" boolean NOT NULL, "slotDuration" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "doctor_id" integer, CONSTRAINT "PK_05a8158cf1112294b1c86e7f1d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctor" ("id" SERIAL NOT NULL, "experience" character varying NOT NULL, "education" character varying NOT NULL, "specialization" character varying NOT NULL, "contact_phone" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_a685e79dc974f768c39e5d1228" UNIQUE ("user_id"), CONSTRAINT "PK_ee6bf6c8de78803212c548fcb94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('patient', 'doctor')`);
        await queryRunner.query(`CREATE TABLE "user" ("user_id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('confirmed', 'cancelled', 'completed', 'rescheduled')`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" SERIAL NOT NULL, "reason" character varying NOT NULL, "status" "public"."appointment_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "slot_id" integer, "doctor_id" integer, "patient_id" integer, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "patient" ADD CONSTRAINT "FK_f20f0bf6b734938c710e12c2782" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "slot" ADD CONSTRAINT "FK_f03805f504ecd34ced30a0c7036" FOREIGN KEY ("availability_id") REFERENCES "availability"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "slot" ADD CONSTRAINT "FK_077afb52a867921c1f0b5147d69" FOREIGN KEY ("elasticScheduleId") REFERENCES "elastic_schedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "availability" ADD CONSTRAINT "FK_fc6c416f48a7d9349b9e4b17d6d" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD CONSTRAINT "FK_a685e79dc974f768c39e5d12281" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb" FOREIGN KEY ("slot_id") REFERENCES "slot"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_9a9c484aa4a944eaec632e00a81" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_86b3e35a97e289071b4785a1402" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_86b3e35a97e289071b4785a1402"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_9a9c484aa4a944eaec632e00a81"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP CONSTRAINT "FK_a685e79dc974f768c39e5d12281"`);
        await queryRunner.query(`ALTER TABLE "availability" DROP CONSTRAINT "FK_fc6c416f48a7d9349b9e4b17d6d"`);
        await queryRunner.query(`ALTER TABLE "slot" DROP CONSTRAINT "FK_077afb52a867921c1f0b5147d69"`);
        await queryRunner.query(`ALTER TABLE "slot" DROP CONSTRAINT "FK_f03805f504ecd34ced30a0c7036"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP CONSTRAINT "FK_f20f0bf6b734938c710e12c2782"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "doctor"`);
        await queryRunner.query(`DROP TABLE "availability"`);
        await queryRunner.query(`DROP TYPE "public"."availability_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."availability_session_enum"`);
        await queryRunner.query(`DROP TYPE "public"."availability_weekday_enum"`);
        await queryRunner.query(`DROP TABLE "slot"`);
        await queryRunner.query(`DROP TYPE "public"."slot_mode_enum"`);
        await queryRunner.query(`DROP TABLE "elastic_schedule"`);
        await queryRunner.query(`DROP TYPE "public"."elastic_schedule_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."elastic_schedule_session_enum"`);
        await queryRunner.query(`DROP TYPE "public"."elastic_schedule_weekday_enum"`);
        await queryRunner.query(`DROP TABLE "patient"`);
    }

}
