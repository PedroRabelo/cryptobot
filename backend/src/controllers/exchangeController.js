const settingsRepository = require('../repositories/settingsRepository');
const withdrawTemplatesRepository = require('../repositories/withdrawTemplatesRepository');
const beholder = require('../beholder');

async function getBalance(req, res, next) {
  const id = res.locals.token.id;
  const settings = await settingsRepository.getSettingsDecrypted(id);

  const exchange = require('../utils/exchange')(settings);

  const info = await exchange.balance();

  const usd = Object.entries(info)
    .map(prop => {
      let available = parseFloat(prop[1].available);
      if (available > 0) available = beholder.tryUSDConversion(prop[0], available);

      let onOrder = parseFloat(prop[1].onOrder);
      if (onOrder > 0) onOrder = beholder.tryUSDConversion(prop[0], onOrder);

      return available + onOrder;
    })
    .reduce((prev, curr) => prev + curr);

  info.usdEstimate = usd.toFixed(2);

  res.json(info);
}

async function getCoins(req, res, next) {
  const id = res.locals.token.id;
  const settings = await settingsRepository.getSettingsDecrypted(id);
  const exchange = require('../utils/exchange')(settings);
  const coins = await exchange.getCoins();
  res.json(coins);
}

async function doWithdraw(req, res, next) {
  const withdrawTemplateId = req.params.id;
  if (!withdrawTemplateId) return res.sendStatus(404);

  const withdrawTemplate = await withdrawTemplatesRepository.getWithdrawTemplate(withdrawTemplateId);
  if (!withdrawTemplate) return res.sendStatus(404);

  let amount = parseFloat(withdrawTemplate.amount);
  if (!amount) {
    if (withdrawTemplate.amount === 'MAX_WALLET') {
      const available = beholder.getMemory(withdrawTemplate.coin, 'WALLET', null);
      if (!available) return res.status(400).json(`No available funds for this coin.`);

      amount = available * (withdrawTemplate.amountMultiplier > 1 ? 1 : withdrawTemplate.amountMultiplier);
    } else if (withdrawTemplate.amount === 'LAST_ORDER_QTY') {
      const keys = beholder.searchMemory(new RegExp(`^((${withdrawTemplate.coin}.+|.+${withdrawTemplate.coin}):LAST_ORDER)$`));
      if (!keys || !keys.length) return res.status(400).json(`No Last order for this coin.`);

      amount = keys[keys.length - 1].value.quantity * withdrawTemplate.amountMultiplier;
    }
  }

  const settingsId = res.locals.token.id;
  const settings = await settingsRepository.getSettingsDecrypted(settingsId);
  const exchange = require('../utils/exchange')(settings);

  try {
    const result = await exchange.withdraw(withdrawTemplate.coin, amount, withdrawTemplate.address, withdrawTemplate.network, withdrawTemplate.addressTag);
    res.json(result);
  } catch {
    res.status(400).json(err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

module.exports = {
  getBalance,
  getCoins,
  doWithdraw
}