import { useContext } from "react";
import { ServiceStackManagerContext, type ServiceStackManagerValue } from "@/hooks/service-stack-manager-context";

export const useServiceStackManager = (): ServiceStackManagerValue => {
  const context = useContext(ServiceStackManagerContext);
  if (!context) {
    throw new Error("useServiceStackManager must be used within ServiceStackManagerProvider");
  }

  return context;
};
