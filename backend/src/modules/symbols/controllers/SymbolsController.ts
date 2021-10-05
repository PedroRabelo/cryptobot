import { Request, Response } from 'express';
import ListSymbolsService from '@modules/symbols/services/ListSymbolsService';
import ShowSymbolService from '@modules/symbols/services/ShowSymbolService';
import UpdateSymbolService from '@modules/symbols/services/UpdateSymbolService';
import SyncSymbolsService from '@modules/symbols/services/SyncSymbolsService';

export default class SymbolsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listSymbols = new ListSymbolsService();

    const symbols = await listSymbols.execute();

    return response.json(symbols);
  }

  public async show(request: Request, response: Response): Promise<Response> {
    const { symbol } = request.params;

    console.log(request.params);
    const showSymbol = new ShowSymbolService();

    const symbols = await showSymbol.execute({ symbol });

    return response.json(symbols);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const {
      symbol,
      base,
      quote,
      basePrecision,
      quotePrecision,
      minNotional,
      minLotSize,
      isFavorite,
    } = request.body;
    const { id } = request.params;

    const updateSymbol = new UpdateSymbolService();

    const updatedSymbol = await updateSymbol.execute({
      id,
      symbol,
      base,
      quote,
      basePrecision,
      quotePrecision,
      minNotional,
      minLotSize,
      isFavorite,
    });

    return response.json(updatedSymbol);
  }

  public async syncSymbols(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const userId = request.user.id;
    const syncSymbols = new SyncSymbolsService();
    await syncSymbols.execute({ userId });
    return response.sendStatus(200);
  }
}
