"use client";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
