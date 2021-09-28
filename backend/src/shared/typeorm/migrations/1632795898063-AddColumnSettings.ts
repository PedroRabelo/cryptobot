import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnSettings1632795898063 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('settings', [
      new TableColumn({
        name: 'stream_url',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('settings', ['stream_url']);
  }
}
