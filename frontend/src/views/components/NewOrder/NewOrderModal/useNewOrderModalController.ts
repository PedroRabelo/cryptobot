import { useState } from "react";

export function useNewOrderModalController() {
  const [error, setError] = useState('')

  const DEFAULT_ORDER = {
    symbol: "",
    price: "0",
    stopPrice: "0",
    quantity: "0",
    icebergQty: "0",
    side: "BUY",
    type: "LIMIT",
  }
  const [order, setOrder] = useState(DEFAULT_ORDER)

  function onInputChange(event: any) {
    setOrder(prevState => ({ ...prevState, [event.id]: event.value }));
  }

  return {
    error,
    setError,
    onInputChange,
    order
  }
}