import { BookTicker } from "./components/BookTicker"
import { LineChart } from "./components/LineChart"
import { MiniTicker } from "./components/MiniTicker"
import { Wallet } from "./components/Wallet"
import { useDashboardController } from "./useDashboardController"

export function Dashboard() {
  const { miniTickerState, bookState, balanceState } = useDashboardController()

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto grid w-full gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
      </div>

      <LineChart />
      <MiniTicker miniTickerData={miniTickerState} />
      <div className="grid grid-cols-2">
        <BookTicker bookTickerData={bookState} />
        <Wallet data={balanceState} />
      </div>
    </div>
  )
}