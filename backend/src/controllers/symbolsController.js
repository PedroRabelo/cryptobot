const symbolsRepository = require('../repositories/symbolsRepository');
const favoriteSymbolsRepository = require('../repositories/favoriteSymbolsRepository');

async function getSymbols(req, res, next) {
  const { search, page, onlyFavorites, pageSize } = req.query;
  const userId = res.locals.token.id;
  const origin = req.headers.origin;
  let favoriteSymbols = [];

  let symbols = {};
  if (search || page)
    symbols = await symbolsRepository.searchSymbols(search, page, pageSize ? parseInt(pageSize) : 10);
  else {
    symbols.rows = await symbolsRepository.getSymbols();
    symbols.count = symbols.rows.length;
  }

  if (!symbols || !symbols.rows || !symbols.rows.length)
    return res.status(404).send(`There are no symbols.`);

  if (origin === process.env.BEHOLDER_URL) {
    const favoriteObjects = await favoriteSymbolsRepository.getFavorites(userId);
    favoriteSymbols = favoriteObjects.map(f => f.symbol);

    symbols.rows = symbols.rows.map(s => {
      return {
        ...s.get({ plain: true }),
        isFavorite: favoriteSymbols.includes(s.symbol)
      }
    });

    if (onlyFavorites === 'true') {
      symbols.rows = symbols.rows.filter(s => s.isFavorite);
      symbols.count = symbols.rows.length;
    }
  }

  res.json(symbols);
}

async function updateSymbol(req, res, next) {
  const newSymbol = req.body;
  const symbol = req.params.symbol;
  const origin = req.headers.origin;

  let result = newSymbol;
  if (origin === process.env.BEHOLDER_URL) {
    const userId = res.locals.token.id;
    if (newSymbol.isFavorite)
      await favoriteSymbolsRepository.insertFavorite({ symbol, userId });
    else
      await favoriteSymbolsRepository.deleteFavorite(symbol, userId);


  } else if (origin === process.env.HYDRA_URL) {
    result = await symbolsRepository.updateSymbol(symbol, newSymbol);
  } else
    return res.sendStatus(403);

  res.json(result);
}

async function getSymbol(req, res, next) {
  const symbol = req.params.symbol;
  if (symbol.startsWith('*')) return res.json({ symbol, base: '*', quote: symbol.replace('*', '') });

  const symbolData = await symbolsRepository.getSymbol(symbol);
  res.json(symbolData)
}

async function syncSymbols(req, res, next) {

  const settingsRepository = require('../repositories/settingsRepository');
  const settings = await settingsRepository.getDefaultSettings();
  const useBlvt = process.env.BINANCE_BLVT === 'true';
  const ignoredCoins = process.env.IGNORED_COINS ? process.env.IGNORED_COINS.split(',') : [];

  const { exchangeInfo } = require('../utils/exchange')(settings);
  let symbols = (await exchangeInfo()).symbols.map(item => {
    if (!useBlvt && (item.baseAsset.endsWith('UP') || item.baseAsset.endsWith('DOWN'))) return false;
    if (ignoredCoins.includes(item.quoteAsset) || ignoredCoins.includes(item.baseAsset)) return false;

    const notionalFilter = item.filters.find(filter => filter.filterType === 'NOTIONAL');
    const lotSizeFilter = item.filters.find(filter => filter.filterType === 'LOT_SIZE');
    const priceFilter = item.filters.find(filter => filter.filterType === 'PRICE_FILTER');

    return {
      symbol: item.symbol,
      basePrecision: item.baseAssetPrecision,
      quotePrecision: item.quoteAssetPrecision,
      base: item.baseAsset,
      quote: item.quoteAsset,
      stepSize: lotSizeFilter ? lotSizeFilter.stepSize : '1',
      tickSize: priceFilter ? priceFilter.tickSize : '1',
      minNotional: notionalFilter ? notionalFilter.minNotional : '1',
      minLotSize: lotSizeFilter ? lotSizeFilter.minQty : '1',
    }
  });

  symbols = symbols.filter(s => s);

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