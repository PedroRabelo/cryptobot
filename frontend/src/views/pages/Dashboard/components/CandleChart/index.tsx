import { memo } from 'react';
import { useCandleChartController } from './useCandleChartController';

interface ICandleChartProps {
  symbol: string;
}

function CandleChart({ symbol }: ICandleChartProps) {
  const { chartContainer } = useCandleChartController(symbol)

  return (
    <div className="h-[520px]">
      <div className="tradingview-widget-container" ref={chartContainer} style={{ height: "100%", width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>

  )
}

export default memo(CandleChart)
