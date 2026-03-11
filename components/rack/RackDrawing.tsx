import type { Side } from "@/types/rackDrawingTypes";

export interface RackItem {
  name: string;
  startU: number;
  endU: number;
  side: Side;
  italic?: boolean;
  category?:
    | "power"
    | "wireless"
    | "network"
    | "console"
    | "generic"
    | "default";
}

export interface RackDrawingProps {
  name: string;
  totalSpaces: number;
  isDoubleWide?: boolean;
  tourShow: string;
  frontItems: RackItem[];
  backItems: RackItem[];
  notes?: string;
}

const ROW_HEIGHT = 32;

const categoryColors: Record<string, string> = {
  power: "bg-rack-item-power",
  wireless: "bg-rack-item-wireless",
  network: "bg-rack-item-network",
  console: "bg-rack-item-console",
  generic: "bg-rack-item-generic",
  default: "bg-rack-item-default",
};

function NumberColumn({ rackSize }: { rackSize: number }) {
  return (
    <div>
      {Array.from({ length: rackSize }, (_, i) => (
        <div
          key={i}
          className={`flex items-center justify-center text-[11px] font-mono text-rack-number border-b border-rack-border ${
            i % 2 === 0 ? "bg-rack-row" : "bg-rack-row-alt"
          }`}
          style={{ height: ROW_HEIGHT }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function RackColumn({
  items,
  rackSize,
}: {
  items: RackItem[];
  rackSize: number;
}) {
  return (
    <div className="relative" style={{ height: rackSize * ROW_HEIGHT }}>
      {Array.from({ length: rackSize }, (_, i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 border-b border-rack-border ${
            i % 2 === 0 ? "bg-rack-row" : "bg-rack-row-alt"
          }`}
          style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
        />
      ))}
      {items.map((item, idx) => {
        const span = item.endU - item.startU + 1;
        const colorClass = categoryColors[item.category ?? "default"];

        return (
          <div
            key={idx}
            className={`absolute left-0 right-0 ${colorClass} border border-foreground/30 flex items-center justify-center text-sm font-medium text-foreground/90 z-10`}
            style={{
              top: (item.startU - 1) * ROW_HEIGHT,
              height: span * ROW_HEIGHT,
            }}
          >
            <span className={item.italic ? "italic text-muted-foreground" : ""}>
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RackDrawing({
  name,
  totalSpaces,
  isDoubleWide,
  tourShow,
  frontItems,
  backItems,
  notes,
}: RackDrawingProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg max-w-4xl print:shadow-none">
      {/* Header */}
      <div className="grid grid-cols-2 border-b border-border">
        <div className="p-5 border-r border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Type
          </div>
          <div className="text-base font-semibold text-foreground mt-1">
            {totalSpaces}-Space {isDoubleWide ? "Double-Wide" : "Single-Wide"}{" "}
            Rack
          </div>
        </div>
        <div className="p-5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Rack
          </div>
          <div className="text-base font-semibold text-primary mt-1">
            {name}
          </div>
        </div>
      </div>

      {/* Tour/Show */}
      <div className="px-5 py-4 border-b border-border bg-rack-header">
        <div className="text-xl font-semibold text-foreground">{tourShow}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-1">
          Tour/Show
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2.5rem_1fr_2rem_1fr] border-b border-border bg-rack-header">
        <div />
        <div className="text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Front
        </div>
        <div />
        <div className="text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Back
        </div>
      </div>

      {/* Rack body */}
      <div className="grid grid-cols-[2.5rem_1fr_2rem_1fr]">
        <div className="border-r border-rack-border">
          <NumberColumn rackSize={totalSpaces} />
        </div>
        <div>
          <RackColumn items={frontItems} rackSize={totalSpaces} />
        </div>
        <div className="border-l border-r border-rack-border">
          <NumberColumn rackSize={totalSpaces} />
        </div>
        <div>
          <RackColumn items={backItems} rackSize={totalSpaces} />
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="border-t-2 border-foreground/30 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Additional Info
          </div>
          <div className="text-sm text-foreground font-mono">{notes}</div>
        </div>
      )}
    </div>
  );
}
