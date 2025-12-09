import { createContext, useContext, useState, type ReactNode } from "react";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import {
  environmentStorage,
  findEnvironmentOwningTarget,
  nextLoopbackAddress,
  runEnvironmentCommand,
} from "@/services/environments";
import { writeCodeWorkspace } from "@/services/workspace";
import { markWorkspaceRequiresRelaunch } from "@/services/workspace-state";
import { applyAllConfigFiles } from "@/services/config-files";

interface ApplyConfigResult {
  success: boolean;
  applied: string[];
  errors: Array<{ path: string; error: string }>;
}

interface EnvironmentContextValue {
  environments: Environment[];
  createEnvironment: (name: string) => Promise<{ success: boolean; error?: string; address?: string; id?: string }>;
  updateEnvironment: (
    id: string,
    updates: { name?: string; envVars?: Record<string, string>; configFiles?: Record<string, string> },
  ) => Promise<{ success: boolean; error?: string }>;
  deleteEnvironment: (id: string) => Promise<{ success: boolean; error?: string }>;
  assignTarget: (
    environmentId: string,
    binding: EnvironmentBinding,
  ) => { success: boolean; error?: string; reassigned?: boolean };
  unassignTarget: (targetPath: string) => void;
  environmentForTarget: (targetPath: string) => Environment | null;
  applyConfigFilesToProjects: (environmentId: string) => Promise<ApplyConfigResult>;
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

    return { success: true, address: nextAddress, id: environment.id };
  };

  const updateEnvironment = async (
    id: string,
    updates: { name?: string; envVars?: Record<string, string>; configFiles?: Record<string, string> },
  ) => {
    if (updates.name !== undefined && !updates.name.trim()) {
      return { success: false, error: "Environment name cannot be empty." };
    }

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
            configFiles: updates.configFiles !== undefined ? updates.configFiles : env.configFiles,
          }
          : env,
      );
      environmentStorage.save(next);
      return next;
    });

    if (error) {
      return { success: false, error };
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

    return { success: true };
  };

  const assignTarget = (environmentId: string, binding: EnvironmentBinding) => {
    const owning = findEnvironmentOwningTarget(environments, binding.targetPath);
    const previousProjectBinding = environments
      .map((env) => ({
        env,
        binding: env.bindings.find((entry) => entry.projectId === binding.projectId),
      }))
      .find((entry) => entry.binding !== undefined) ?? null;
    const reassigned =
      (owning && owning.environment.id !== environmentId) ||
      (previousProjectBinding && previousProjectBinding.env.id !== environmentId) ||
      (previousProjectBinding && previousProjectBinding.binding?.targetPath !== binding.targetPath);
    let error: string | undefined;

    setEnvironments((prev) => {
      const targetEnvironment = prev.find((env) => env.id === environmentId);
      if (!targetEnvironment) {
        error = "Environment not found.";
        return prev;
      }

      const next = prev.map((env) => {
        // Remove any existing attachment for this target and for this project across all environments.
        const filtered = env.bindings.filter(
          (entry) => entry.targetPath !== binding.targetPath && entry.projectId !== binding.projectId,
        );
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

    return { success: true, reassigned };
  };

  const unassignTarget = (targetPath: string) => {
    setEnvironments((prev) => {
      const next = prev.map((env) => ({
        ...env,
        bindings: env.bindings.filter((binding) => binding.targetPath !== targetPath),
      }));
      environmentStorage.save(next);
      return next;
    });
  };

  const applyConfigFilesToProjects = async (environmentId: string): Promise<ApplyConfigResult> => {
    const environment = environments.find((env) => env.id === environmentId);
    if (!environment) {
      return { success: false, applied: [], errors: [{ path: "", error: "Environment not found." }] };
    }

    const configFiles = environment.configFiles ?? {};
    if (Object.keys(configFiles).length === 0) {
      return { success: true, applied: [], errors: [] };
    }

    const allApplied: string[] = [];
    const allErrors: Array<{ path: string; error: string }> = [];

    for (const binding of environment.bindings) {
      const result = await applyAllConfigFiles(binding.targetPath, configFiles, environment.address);
      allApplied.push(...result.applied.map((p) => `${binding.targetPath}/${p}`));
      allErrors.push(...result.errors.map((e) => ({ path: `${binding.targetPath}/${e.path}`, error: e.error })));
    }

    return {
      success: allErrors.length === 0,
      applied: allApplied,
      errors: allErrors,
    };
  };

  const value: EnvironmentContextValue = {
    environments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    assignTarget,
    unassignTarget,
    environmentForTarget,
    applyConfigFilesToProjects,
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
