import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSymbols1632175590827 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'symbols',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            generationStrategy: 'increment',
            isGenerated: true,
          },
          {
            name: 'symbol',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'base_precision',
            type: 'int',
          },
          {
            name: 'quote_precision',
            type: 'int',
          },
          {
            name: 'min_notional',
            type: 'varchar',
          },
          {
            name: 'min_lot_size',
            type: 'varchar',
          },
          {
            name: 'is_favorite',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('symbols');
  }
}
