import { EntityRepository, Repository } from 'typeorm';
import Symbols from '@modules/symbols/typeorm/entities/Symbols';

@EntityRepository(Symbols)
class SymbolsRepository extends Repository<Symbols> {
  public async findByName(name: string): Promise<Symbols | undefined> {
    console.log(name);
    const symbol = await this.findOne({ where: { symbol: name } });

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
