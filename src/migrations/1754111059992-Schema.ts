import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1754111059992 implements MigrationInterface {
    name = 'Schema1754111059992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability" ALTER COLUMN "maxBookings" SET DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability" ALTER COLUMN "maxBookings" DROP DEFAULT`);
    }

}
