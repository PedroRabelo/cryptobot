import { Balance } from "@/app/entities/Balance";
import { exchangeService } from "@/app/services/exchangeService";
import { useEffect, useState } from "react";

export function useWalletController(data: any) {

  const [balances, setBalances] = useState<Balance[]>()

  async function fetchBalance() {
    const balanceResponse = await exchangeService.getBalance()
    const balancesEntries = Object.entries(balanceResponse).map((item: any) => {
      return {
        symbol: item[0],
        available: item[1].available,
        onOrder: item[1].onOrder
      }
    })

    setBalances(balancesEntries)
  }

  useEffect(() => {
    fetchBalance()
  }, [data])

  return {
    balances
  }
}