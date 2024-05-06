import { memo } from 'react';
import { useCandleChartController } from './useCandleChartController';

interface ICandleChartProps {
  symbol: string;
}

function CandleChart({ symbol }: ICandleChartProps) {
  const { chartContainer } = useCandleChartController(symbol)

  return (
    <div className="tradingview-widget-container" ref={chartContainer} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  )
}

export default memo(CandleChart)
