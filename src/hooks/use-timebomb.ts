import { useEffect, useState } from "react";
import { fetchTimebombStatus, TimebombStatus } from "@/services/timebomb";

interface UseTimebombResult {
  status: TimebombStatus | null;
  isLoading: boolean;
  isBlocked: boolean;
}

export function useTimebomb(): UseTimebombResult {
  const [status, setStatus] = useState<TimebombStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimebombStatus()
      .then(setStatus)
      .finally(() => setIsLoading(false));
  }, []);

  const isBlocked = status?.isExpired === true || status?.isKilled === true;

  return { status, isLoading, isBlocked };
}
