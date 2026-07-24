import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

const presets = [
  { label: "Hoje", getRange: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now }; } },
  { label: "Ontem", getRange: () => { const y = new Date(); y.setDate(y.getDate() - 1); return { from: new Date(y.getFullYear(), y.getMonth(), y.getDate()), to: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59) }; } },
  { label: "Últimos 7 dias", getRange: () => { const now = new Date(); const from = new Date(now.getTime() - 7 * 86400000); return { from, to: now }; } },
  { label: "Últimos 14 dias", getRange: () => { const now = new Date(); const from = new Date(now.getTime() - 14 * 86400000); return { from, to: now }; } },
  { label: "Últimos 30 dias", getRange: () => { const now = new Date(); const from = new Date(now.getTime() - 30 * 86400000); return { from, to: now }; } },
  { label: "Este mês", getRange: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }; } },
  { label: "Mês passado", getRange: () => { const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth() - 1, 1); const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); return { from, to }; } },
];

const DateRangePicker = ({ dateRange, onDateRangeChange }: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectingFrom, setSelectingFrom] = useState(true);

  const formatRange = () => {
    const fromStr = format(dateRange.from, "dd MMM", { locale: ptBR });
    const toStr = format(dateRange.to, "dd MMM yyyy", { locale: ptBR });
    return `${fromStr} — ${toStr}`;
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    if (selectingFrom) {
      onDateRangeChange({ from: date, to: dateRange.to < date ? date : dateRange.to });
      setSelectingFrom(false);
    } else {
      onDateRangeChange({ from: dateRange.from, to: date < dateRange.from ? dateRange.from : date });
      setSelectingFrom(true);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(220,20%,9%)] border border-[hsl(220,15%,18%)] text-[11px] text-white hover:border-[hsl(220,15%,25%)] transition-all">
          <Calendar className="w-3.5 h-3.5 text-[hsl(14,100%,55%)]" />
          <span className="hidden sm:inline">{formatRange()}</span>
          <span className="sm:hidden text-[10px]">{format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}</span>
          <ChevronDown className="w-3 h-3 text-[hsl(220,10%,40%)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[hsl(220,20%,9%)] border-[hsl(220,15%,18%)]" align="end" sideOffset={8}>
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-[hsl(220,15%,14%)] p-2 min-w-[140px]">
            <p className="text-[9px] text-[hsl(220,10%,40%)] uppercase tracking-wider font-medium px-2 py-1.5">Períodos</p>
            {presets.map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  onDateRangeChange(preset.getRange());
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md text-[11px] text-[hsl(220,10%,60%)] hover:text-white hover:bg-[hsl(220,20%,14%)] transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Calendar */}
          <div className="p-3">
            <p className="text-[10px] text-[hsl(220,10%,45%)] mb-2 text-center">
              {selectingFrom ? "Selecione a data inicial" : "Selecione a data final"}
            </p>
            <CalendarComponent
              mode="single"
              selected={selectingFrom ? dateRange.from : dateRange.to}
              onSelect={handleSelect}
              className={cn("p-0 pointer-events-auto")}
              disabled={(date) => date > new Date()}
            />
            <div className="mt-2 pt-2 border-t border-[hsl(220,15%,14%)] flex items-center justify-between">
              <div className="text-[10px] text-[hsl(220,10%,40%)]">
                <span className="text-[hsl(14,100%,55%)]">{format(dateRange.from, "dd/MM/yy")}</span>
                {" → "}
                <span className="text-[hsl(145,70%,50%)]">{format(dateRange.to, "dd/MM/yy")}</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
