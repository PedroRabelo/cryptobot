import { useState } from 'react';
import useWebSocket from 'react-use-websocket';

export function useDashboardController() {

  const [miniTickerState, setMiniTickerState] = useState<any>()
  const [bookState, setBookState] = useState<any>([])
  const [balanceState, setBalanceState] = useState<any>([])

  const { lastJsonMessage } = useWebSocket<{ miniTicker: any, books: any, balance: any }>(import.meta.env.VITE_WS_URL, {
    onOpen: () => console.log(`Connected to App WS Server`),
    onMessage: () => {
      if (lastJsonMessage) {
        if (lastJsonMessage.miniTicker) {
          setMiniTickerState(lastJsonMessage.miniTicker)
        } else if (lastJsonMessage.balance) {
          setBalanceState(lastJsonMessage.balance);
        } else if (lastJsonMessage.books) {
          lastJsonMessage.books.forEach((b: any) => bookState[b.symbol] = b)
          setBookState(bookState)
        }
      }
    },
    queryParams: {},
    onError: (err) => console.error(err),
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 20
  });

  return {
    miniTickerState,
    bookState,
    balanceState
  }
}