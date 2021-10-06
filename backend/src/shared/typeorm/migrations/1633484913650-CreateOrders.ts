import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrders1633484913650 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            generationStrategy: 'increment',
            isGenerated: true,
          },
          {
            name: 'automation_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'symbol',
            type: 'varchar',
          },
          {
            name: 'order_id',
            type: 'bigint',
            isUnique: true,
          },
          {
            name: 'client_order_id',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'transact_time',
            type: 'bigint',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'side',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'is_maker',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'limit_price',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stop_price',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'avg_price',
            type: 'decimal(18,8)',
            isNullable: true,
          },
          {
            name: 'commission',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'net',
            type: 'decimal(18,8)',
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'varchar',
          },
          {
            name: 'obs',
            type: 'varchar',
            isNullable: true,
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
    await queryRunner.dropTable('orders');
  }
}
