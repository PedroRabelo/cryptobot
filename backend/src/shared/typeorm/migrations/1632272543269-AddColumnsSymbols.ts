import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsSymbols1632272543269 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('symbols', [
      new TableColumn({
        name: 'base',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'quote',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('symbols', ['base', 'quote']);
  }
}
