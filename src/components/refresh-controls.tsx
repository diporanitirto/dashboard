"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotifBell from "@/components/notif-bell";

export default function RefreshControls({ intervalSeconds = 15 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
    setLastUpdated(new Date());
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [intervalSeconds, refresh]);

  return (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Diperbarui{" "}
          {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
      <Button
        variant="outline"
        size="icon-lg"
        onClick={refresh}
        disabled={isPending}
        aria-label="Refresh data"
        title="Refresh data"
      >
        <RefreshCw className={isPending ? "animate-spin" : undefined} />
      </Button>
      <NotifBell />
    </div>
  );
}
