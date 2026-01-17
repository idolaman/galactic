import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import {
  environmentStorage,
  findEnvironmentOwningTarget,
  nextLoopbackAddress,
  runEnvironmentCommand,
} from "@/services/environments";
import { writeCodeWorkspace } from "@/services/workspace";
import { markWorkspaceRequiresRelaunch } from "@/services/workspace-state";
import {
  trackEnvironmentAttached,
  trackEnvironmentCreated,
  trackEnvironmentDeleted,
  trackEnvironmentDetached,
  trackEnvironmentUpdated,
} from "@/services/analytics";

interface EnvironmentContextValue {
  environments: Environment[];
  createEnvironment: (name: string) => Promise<{ success: boolean; error?: string; address?: string; id?: string }>;
  updateEnvironment: (
    id: string,
    updates: { name?: string; envVars?: Record<string, string> },
  ) => Promise<{ success: boolean; error?: string }>;
  deleteEnvironment: (id: string) => Promise<{ success: boolean; error?: string }>;
  assignTarget: (
    environmentId: string,
    binding: EnvironmentBinding,
  ) => { success: boolean; error?: string; reassigned?: boolean };
  unassignTarget: (targetPath: string) => void;
  environmentForTarget: (targetPath: string) => Environment | null;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  const [environments, setEnvironments] = useState<Environment[]>(() => environmentStorage.load());

  const environmentForTarget = (targetPath: string) => {
    const hit = findEnvironmentOwningTarget(environments, targetPath);
    return hit?.environment ?? null;
  };

  const createEnvironment = async (name: string) => {
    const nextAddress = nextLoopbackAddress(environments);
    if (!nextAddress) {
      return { success: false, error: "No available loopback addresses remaining (127.0.0.x is exhausted)." };
    }

    const commandResult = await runEnvironmentCommand("add", nextAddress);
    if (!commandResult.success) {
      return { success: false, error: commandResult.error ?? "Unable to configure loopback alias." };
    }

    const environment: Environment = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      name,
      address: nextAddress,
      createdAt: Date.now(),
      bindings: [],
    };

    setEnvironments((prev) => {
      const next = environmentStorage.upsert(environment);
      return next;
    });

    // Track analytics
    trackEnvironmentCreated(nextAddress);

    return { success: true, address: nextAddress, id: environment.id };
  };

  const updateEnvironment = async (
    id: string,
    updates: { name?: string; envVars?: Record<string, string> },
  ) => {
    if (updates.name !== undefined && !updates.name.trim()) {
      return { success: false, error: "Environment name cannot be empty." };
    }

    const currentEnv = environments.find((env) => env.id === id);
    const previousEnvVars = currentEnv?.envVars ?? {};
    const envVarsChanged =
      updates.envVars !== undefined &&
      JSON.stringify(previousEnvVars) !== JSON.stringify(updates.envVars);
    const nextEnvVars = updates.envVars ?? previousEnvVars;

    let error: string | undefined;
    setEnvironments((prev) => {
      const target = prev.find((env) => env.id === id);
      if (!target) {
        error = "Environment not found.";
        return prev;
      }

      const next = prev.map((env) =>
        env.id === id
          ? {
              ...env,
              name: updates.name !== undefined ? updates.name.trim() : env.name,
              envVars: updates.envVars !== undefined ? updates.envVars : env.envVars,
            }
          : env,
      );
      environmentStorage.save(next);
      return next;
    });

    if (error) {
      return { success: false, error };
    }
    if (envVarsChanged) {
      trackEnvironmentUpdated(Object.keys(nextEnvVars ?? {}).length);
    }
    return { success: true };
  };

  const deleteEnvironment = async (id: string) => {
    const environment = environments.find((env) => env.id === id);
    if (!environment) {
      return { success: false, error: "Environment not found." };
    }

    const commandResult = await runEnvironmentCommand("remove", environment.address);
    if (!commandResult.success) {
      return { success: false, error: commandResult.error ?? "Unable to remove loopback alias." };
    }

    // Clear configurations from all bound workspaces before removing environment
    await Promise.all(
      environment.bindings.map(async (binding) => {
        await writeCodeWorkspace(binding.targetPath, null);
        markWorkspaceRequiresRelaunch(binding.targetPath);
      })
    );

    setEnvironments((prev) => {
      const next = environmentStorage.remove(id);
      return next;
    });

    trackEnvironmentDeleted(environment.bindings.length);
    return { success: true };
  };

  const assignTarget = (environmentId: string, binding: EnvironmentBinding) => {
    const owning = findEnvironmentOwningTarget(environments, binding.targetPath);
    const selectedEnvironment = environments.find((env) => env.id === environmentId);
    const reassigned = owning !== null && owning.environment.id !== environmentId;
    let error: string | undefined;

    setEnvironments((prev) => {
      const targetEnvironment = prev.find((env) => env.id === environmentId);
      if (!targetEnvironment) {
        error = "Environment not found.";
        return prev;
      }

      const next = prev.map((env) => {
        const filtered = env.bindings.filter((entry) => entry.targetPath !== binding.targetPath);
        if (env.id === environmentId) {
          return { ...env, bindings: [...filtered, binding] };
        }
        return { ...env, bindings: filtered };
      });

      environmentStorage.save(next);
      return next;
    });

    if (error) {
      return { success: false, error };
    }

    if (selectedEnvironment) {
      const envVarsCount = Object.keys(selectedEnvironment.envVars ?? {}).length;
      trackEnvironmentAttached(binding.kind, envVarsCount, reassigned);
    }

    return { success: true, reassigned };
  };

  const unassignTarget = (targetPath: string) => {
    const owning = findEnvironmentOwningTarget(environments, targetPath);
    setEnvironments((prev) => {
      const next = prev.map((env) => ({
        ...env,
        bindings: env.bindings.filter((binding) => binding.targetPath !== targetPath),
      }));
      environmentStorage.save(next);
      return next;
    });
    if (owning) {
      trackEnvironmentDetached(owning.binding.kind);
    }
  };

  const value: EnvironmentContextValue = {
    environments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    assignTarget,
    unassignTarget,
    environmentForTarget,
  };

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
};

export const useEnvironmentManager = (): EnvironmentContextValue => {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) {
    throw new Error("useEnvironmentManager must be used within EnvironmentProvider");
  }
  return ctx;
};
