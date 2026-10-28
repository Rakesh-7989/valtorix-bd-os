"use client";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-zinc-500">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <span>👤</span>
            <span className="hidden sm:inline">Account</span>
            <span className="text-xs text-zinc-500">(placeholder)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
