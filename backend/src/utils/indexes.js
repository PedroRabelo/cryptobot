const technicalindicators = require('technicalindicators');

const indexKeys = {
  RSI: 'RSI',
  MACD: 'MACD'
}

function RSI(closes, period = 14) {
  const rsiResult = technicalindicators.rsi({
    period: period,
    values: closes
  });
  return {
    current: parseFloat(rsiResult[rsiResult.length - 1]),
    previous: parseFloat(rsiResult[rsiResult.length - 2]),
  }
}

function MACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const macdResult = technicalindicators.macd({
    values: closes,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
    fastPeriod,
    slowPeriod,
    signalPeriod
  });

  return {
    current: macdResult[macdResult.length - 1],
    previous: macdResult[macdResult.length - 2],
  }
}

module.exports = {
  indexKeys,
  RSI,
  MACD
}