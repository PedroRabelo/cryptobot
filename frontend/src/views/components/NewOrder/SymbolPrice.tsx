import { useState } from "react";
import useWebSocket from "react-use-websocket";

interface IProps {
  symbol: string;
}

export function SymbolPrice({ symbol }: IProps) {

  const [book, setBook] = useState({ bid: '0', ask: '0' });

  function getBinanceWSUrl() {
    if (!symbol) return '';
    return `${import.meta.env.VITE_BWS_URL}/${symbol.toLowerCase()}@bookTicker`;
  }

  const { lastJsonMessage, sendJsonMessage } = useWebSocket<{ a: string, b: string }>(getBinanceWSUrl(), {
    onOpen: () => {
      if (!symbol) return;
      console.log(`Connected to Binance Stream ${symbol}`);
      sendJsonMessage({
        method: "SUBSCRIBE",
        params: [`${symbol.toLowerCase()}@bookTicker`],
        id: 1
      })
    },
    onMessage: () => {
      if (lastJsonMessage) {
        setBook({ bid: lastJsonMessage.b, ask: lastJsonMessage.a })
      }
    },
    onError: (event) => console.error(event),
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000
  })

  if (!symbol) return <></>

  return (
    <div className="flex gap-4 mt-2 text-sm">
      <span>Market Price</span>
      <span>BID: {book.bid}</span>
      <span>ASK: {book.ask}</span>
    </div>
  )

}