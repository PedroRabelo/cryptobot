import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnUsers1630592962537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
      }),
      new TableColumn({
        name: 'deleted_by',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', ['deleted_at', 'deleted_by']);
  }
}
