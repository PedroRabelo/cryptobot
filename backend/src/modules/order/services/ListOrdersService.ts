import { getCustomRepository, Like } from 'typeorm';
import Order from '@modules/order/typeorm/entities/Order';
import OrdersRepository from '../typeorm/repositories/OrdersRepository';

const PAGE_SIZE = 10;

interface IRequest {
  symbol: string;
  page: number;
}

class ListOrdersService {
  public async execute({ symbol, page }: IRequest): Promise<[Order[], number]> {
    const ordersRepository = getCustomRepository(OrdersRepository);

    const options = {
      where: {},
      // order: [['updated_at', 'DESC']],
      // limit: PAGE_SIZE,
      // offset: PAGE_SIZE * (page - 1),
    };

    if (symbol) {
      if (symbol.length < 6) options.where = { symbol: Like(`%${symbol}%`) };
      else options.where = { symbol };
    }

    return await ordersRepository.findAndCount(options);
  }
}

export default ListOrdersService;
