export default function Header() {
  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      {/* Aligns the header contents perfectly with the conversation window */}
      <div className="mx-auto max-w-3xl px-4 py-3.5 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold tracking-tight text-foreground select-none">
            Veyrux
          </h1>
          <p className="text-xs text-muted-foreground select-none hidden sm:block">
            Your Personal AI Assistant
          </p>
        </div>

        {/* You can add a quick status badge or clean utility button on the right later */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-muted-foreground/80 tracking-wider uppercase">
            v0.2
          </span>
        </div>
      </div>
    </header>
  );
}
