import { SelectQuote } from "@/views/components/SelectQuote"
import { BookTicker } from "./components/BookTicker"
import CandleChart from "./components/CandleChart"
import { MiniTicker } from "./components/MiniTicker"
import { Wallet } from "./components/Wallet"
import { useDashboardController } from "./useDashboardController"

export function Dashboard() {
  const { miniTickerState, bookState, balanceState, quote, onQuoteChange } = useDashboardController()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between mx-auto w-full gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <SelectQuote onChange={onQuoteChange} />
      </div>

      <CandleChart symbol={quote!} />
      <MiniTicker miniTickerData={miniTickerState} />
      <div className="grid grid-cols-2">
        <BookTicker bookTickerData={bookState} />
        <Wallet data={balanceState} />
      </div>
    </div>
  )
}