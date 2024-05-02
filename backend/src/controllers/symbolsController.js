const symbolsRepository = require('../repositories/symbolsRepository');
const crypto = require('../utils/crypto');

async function getSymbols(req, res, next) {
  const symbols = await symbolsRepository.getSymbols();
  res.json(symbols)
}

async function updateSymbol(req, res, next) {
  const newSymbol = req.body;
  const symbol = req.params.symbol;
  await symbolsRepository.updateSymbol(symbol, newSymbol);

  res.sendStatus(200);
}

async function getSymbol(req, res, next) {
  const symbol = req.params.symbol;
  const symbolData = await symbolsRepository.getSymbol(symbol);
  res.json(symbolData)
}

async function syncSymbols(req, res, next) {

  const favoriteSymbols = (await symbolsRepository.getSymbols()).filter(s => s.isFavorite).map(s => s.symbol);

  const settingsRepository = require('../repositories/settingsRepository');
  const settings = await settingsRepository.getSettingsDecrypted(res.locals.token.id);
  const { exchangeInfo } = require('../utils/exchange')(settings.get({ plain: true }));

  const symbols = (await exchangeInfo()).symbols.map(item => {
    const notionalFilter = item.filters.find(filter => filter.filterType === 'NOTIONAL');
    const lotSizeFilter = item.filters.find(filter => filter.filterType === 'LOT_SIZE');

    return {
      symbol: item.symbol,
      basePrecision: item.baseAssetPrecision,
      quotePrecision: item.quoteAssetPrecision,
      base: item.baseAsset,
      quote: item.quoteAsset,
      minNotional: notionalFilter ? notionalFilter.minNotional : '1',
      minLotSize: lotSizeFilter ? lotSizeFilter.minQty : '1',
      isFavorite: favoriteSymbols.some(s => s === item.symbol)
    }
  });

  await symbolsRepository.deleteAll();
  await symbolsRepository.bulkInsert(symbols);

  res.sendStatus(201);
}

module.exports = {
  getSymbols,
  updateSymbol,
  getSymbol,
  syncSymbols
}