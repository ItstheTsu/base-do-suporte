interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export default function Loading({ label = "Loading", fullScreen = false }: LoadingProps) {
  const wrapperClass = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/80"
    : "flex items-center justify-center py-10";

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <div className="flex items-center gap-3 font-mono text-sm text-[#8B98A5]">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5EEAD4] opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[#5EEAD4]" />
        </span>
        <span>{label}…</span>
      </div>
    </div>
  );
}
