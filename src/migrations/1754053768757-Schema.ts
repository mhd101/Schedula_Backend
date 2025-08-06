import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1754053768757 implements MigrationInterface {
    name = 'Schema1754053768757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability" DROP COLUMN "waveDuration"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability" ADD "waveDuration" integer`);
    }

}
