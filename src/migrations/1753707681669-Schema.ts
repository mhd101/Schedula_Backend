import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1753707681669 implements MigrationInterface {
    name = 'Schema1753707681669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "reason"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "reason" character varying NOT NULL`);
    }

}
