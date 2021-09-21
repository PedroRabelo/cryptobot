import { EntityRepository, Repository } from 'typeorm';
import Symbols from '@modules/symbols/typeorm/entities/Symbols';

@EntityRepository(Symbols)
class SymbolsRepository extends Repository<Symbols> {
  public async findByName(name: string): Promise<Symbols | undefined> {
    const symbol = await this.findOne({ where: { name } });

    return symbol;
  }

  public async findById(id: number): Promise<Symbols | undefined> {
    const symbol = await this.findOne({ where: { id } });

    return symbol;
  }

  public async deleteAll(): Promise<void> {
    await this.createQueryBuilder().delete().from(Symbols).execute();
  }

  public async bulkInsert(symbols: Symbols): Promise<Symbols> {
    return await this.save(symbols);
  }
}

export default SymbolsRepository;
