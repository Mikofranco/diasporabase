/**
 * Full-page loader for dashboard routes. Uses app brand colors (sky/diaspora blue).
 */
export function DashboardLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background transition-colors duration-300">
      <div className="flex flex-col items-center gap-6 animate-loader-fade-in">
        {/* Gradient ring spinner – app primary gradient */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-2 border-sky-200/60 dark:border-sky-900/40"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 border-r-sky-400 animate-loader-ring"
            aria-hidden
          />
          <div className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.6)] dark:bg-sky-400 dark:shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
        </div>

        {/* Optional label with bouncing dots */}
        {label !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            <span className="flex gap-1" aria-hidden>
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-loader-dot"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-loader-dot"
                style={{ animationDelay: "160ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-loader-dot"
                style={{ animationDelay: "320ms" }}
              />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
