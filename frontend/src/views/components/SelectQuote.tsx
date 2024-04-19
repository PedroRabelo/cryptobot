import { ISymbol } from "@/app/entities/Symbols"
import { cn } from "@/app/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const symbols = [
  {
    value: "FAVORITES",
    label: "FAVORITES",
  },
  {
    value: "BNB",
    label: "BNB",
  },
  {
    value: "BRL",
    label: "BRL",
  },
  {
    value: "BTC",
    label: "BTC",
  },
  {
    value: "USD",
    label: "USD",
  },
  {
    value: "USDT",
    label: "USDT",
  },
]

interface IProps {
  onChange(quote: string): void;
}

const DEFAULT_QUOTE_PROPERTY = "defaultQuote"

export function getDefaultQuote() {
  return localStorage.getItem(DEFAULT_QUOTE_PROPERTY) ? localStorage.getItem("defaultQuote") : "USD"
}

export function setDefaultQuote(quote: string) {
  return localStorage.setItem(DEFAULT_QUOTE_PROPERTY, quote)
}

export function filterSymbolObjects(symbols: ISymbol[], quote: string) {
  return symbols.filter(s => {
    if (quote === 'FAVORITES')
      return s.isFavorite
    else
      return s.symbol.endsWith(quote)
  })
}

export function SelectQuote({ onChange }: IProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(getDefaultQuote())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? symbols.find((symbol) => symbol.value === value)?.label
            : "Select symbol..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search symbol..." />
          <CommandEmpty>No symbol found.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {symbols.map((symbol) => (
                <CommandItem
                  key={symbol.value}
                  value={symbol.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    onChange(currentValue)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === symbol.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {symbol.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}