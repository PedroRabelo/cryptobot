import { useEffect, useRef } from "react";

export function useCandleChartController(symbol: string) {

  const chartContainer = useRef<HTMLDivElement | null>(null)

  useEffect(
    () => {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "BINANCE:${symbol}USDT",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "allow_symbol_change": false,
          "calendar": false,
          "support_host": "https://www.tradingview.com",
          "studies": [
            "RSI@tv-basicstudies"
          ]
        }`;
      chartContainer.current?.appendChild(script);
    },
    [symbol]
  );

  return {
    chartContainer,
  }
}