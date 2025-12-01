import { useEffect, useMemo, useState } from "react";
import {
  HardDrive,
  Network,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import type { Environment } from "@/types/environment";
import { cn } from "@/lib/utils";
import { writeCodeWorkspace } from "@/services/workspace";
import { markWorkspaceRequiresRelaunch } from "@/services/workspace-state";

export default function Environments() {
  const { environments, createEnvironment, updateEnvironment, deleteEnvironment, unassignTarget } =
    useEnvironmentManager();
  const { toast } = useToast();

  // State
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(
    null
  );
  const [newEnvName, setNewEnvName] = useState("");
  
  // Configuration form state
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarSuffix, setNewVarSuffix] = useState("");
  const [renameName, setRenameName] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(
    null
  );

  // Select initial environment
  useEffect(() => {
    if (environments.length > 0 && !selectedEnvironmentId) {
      setSelectedEnvironmentId(environments[0].id);
    } else if (
      selectedEnvironmentId &&
      !environments.find((e) => e.id === selectedEnvironmentId)
    ) {
      setSelectedEnvironmentId(environments.length > 0 ? environments[0].id : null);
    }
  }, [environments, selectedEnvironmentId]);

  const selectedEnvironment = useMemo(
    () => environments.find((env) => env.id === selectedEnvironmentId) || null,
    [environments, selectedEnvironmentId]
  );

  // Sync local config state with selected environment
  useEffect(() => {
    if (selectedEnvironment) {
      setEnvVars(selectedEnvironment.envVars || {});
    }
  }, [selectedEnvironment]);

  const handleAddEnvVar = () => {
    const key = newVarKey.trim();
    if (!key || !selectedEnvironment) return;
    
    // Check if key already exists
    if (Object.keys(envVars).some(k => k.trim() === key)) {
      toast({
        title: "Variable exists",
        description: `Environment variable '${key}' already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    // Enforce IP prefix
    const value = `${selectedEnvironment.address}${newVarSuffix}`;
    const next = { ...envVars, [key]: value };
    setEnvVars(next);
    setNewVarKey("");
    setNewVarSuffix("");
    
    // Trigger auto-save after adding
    saveConfig(selectedEnvironment.id, next);
  };

  const handleRemoveEnvVar = (key: string) => {
    const next = { ...envVars };
    delete next[key];
    setEnvVars(next);
    
    // Trigger auto-save after removing
    saveConfig(selectedEnvironment?.id, next);
  };

  // Helper to debounce/unify save logic
  const saveConfig = async (envId: string | undefined, vars: Record<string, string>) => {
     if (!envId || !selectedEnvironment) return;
     
     const result = await updateEnvironment(envId, {
       envVars: vars,
     });

     if (!result.success) {
       toast({
         title: "Failed to update",
         description: result.error || "Unknown error.",
         variant: "destructive",
       });
       return;
     }

     // Update all .code-workspace files
     const updatePromises = selectedEnvironment.bindings.map(async (binding) => {
       await writeCodeWorkspace(binding.targetPath, {
         address: selectedEnvironment.address,
         envVars: vars,
       });
       markWorkspaceRequiresRelaunch(binding.targetPath);
     });
     await Promise.all(updatePromises);
     
     toast({ title: "Settings saved", description: "Environment configuration updated." });
  };

  const handleCreateEnvironment = async () => {
    const trimmed = newEnvName.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Please give the environment a name.",
        variant: "destructive",
      });
      return;
    }

    if (environments.some((env) => env.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Name taken",
        description: "An environment with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createEnvironment(trimmed);
      if (!result.success) {
        toast({
          title: "Failed to create environment",
          description: result.error || "Unknown error occurred.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Environment created",
        description: `${trimmed} (${result.address}) is ready.`,
      });
      setNewEnvName("");
      setIsCreateDialogOpen(false);
      if (result.id) {
        setSelectedEnvironmentId(result.id);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameEnvironment = async () => {
    if (!selectedEnvironmentId) return;
    const trimmed = renameName.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Environment name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (
      environments.some(
        (env) =>
          env.id !== selectedEnvironmentId &&
          env.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast({
        title: "Name taken",
        description: "An environment with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    const result = await updateEnvironment(selectedEnvironmentId, {
      name: trimmed,
    });

    if (!result.success) {
      toast({
        title: "Failed to rename",
        description: result.error || "Unknown error.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Environment renamed", description: `Renamed to ${trimmed}.` });
    setIsRenameDialogOpen(false);
  };
  
  const handleDeleteEnvironment = async () => {
    if (!environmentToDelete) return;

    try {
      const result = await deleteEnvironment(environmentToDelete.id);
      if (!result.success) {
        toast({
          title: "Failed to delete",
          description: result.error || "Could not remove loopback alias.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Environment deleted",
        description: `${environmentToDelete.name} has been removed.`,
      });
    } finally {
      setEnvironmentToDelete(null);
    }
  };

  const handleUnassign = async (targetPath: string, targetLabel: string) => {
    unassignTarget(targetPath);
    
    // Clear configuration and request relaunch
    await writeCodeWorkspace(targetPath, null);
    markWorkspaceRequiresRelaunch(targetPath);

    toast({
      title: "Binding removed",
      description: `${targetLabel} detached from environment.`,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6 shrink-0 gap-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Environments</h1>
          <Badge variant="outline" className="ml-2 font-mono text-xs">
            {environments.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Environment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Environment</DialogTitle>
                <DialogDescription>
                  Add a new isolated network environment. This creates a local
                  loopback alias (e.g., 127.0.0.2).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Full Stack Dev Environment"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateEnvironment();
                    }}
                  />
                </div>
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground flex gap-2 items-start">
                  <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Requires macOS privileges. You may be prompted for your password
                    to configure the network interface.
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button disabled={isCreating} onClick={handleCreateEnvironment}>
                  {isCreating ? "Creating..." : "Create Environment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs 
          value={selectedEnvironmentId || ""} 
          onValueChange={(val) => setSelectedEnvironmentId(val)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tabs List Bar */}
          <div className="border-b bg-muted/10 px-6 pt-2">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-2 flex-wrap rounded-none border-b-0">
            {environments.map((env) => (
              <TabsTrigger
                key={env.id}
                value={env.id}
                className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-3 h-auto"
              >
                <span className="mr-2">{env.name}</span>
                <Badge variant="secondary" className="font-mono text-[10px] px-1 h-4 leading-none">
                  {env.address}
                </Badge>
              </TabsTrigger>
            ))}
            {environments.length === 0 && (
              <div className="py-3 text-sm text-muted-foreground px-2">
                No environments yet
              </div>
            )}
          </TabsList>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-hidden bg-muted/10">
            {selectedEnvironment ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Detail Header */}
                <div className="p-6 pb-4 border-b bg-background">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        {selectedEnvironment.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Network className="h-4 w-4" />
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                          {selectedEnvironment.address}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setRenameName(selectedEnvironment.name);
                          setIsRenameDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setEnvironmentToDelete(selectedEnvironment)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 p-6">
                  <div className="max-w-4xl space-y-8 mx-auto">
                    
                    {/* Configuration Card */}
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted/40 pb-4">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Environment Settings</CardTitle>
                        </div>
                        <CardDescription>
                          Configure how your project connects to this environment.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 grid gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Environment Variables</Label>
                          </div>
                          
                          <div className="grid gap-3">
                            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                               <Input 
                                 placeholder="Key (e.g. HOST)" 
                                 className="font-mono text-xs"
                                 value={newVarKey}
                                 onChange={(e) => setNewVarKey(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleAddEnvVar()}
                               />
                               <div className="flex items-center rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
                                  <span className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 border-r h-full flex items-center font-mono shrink-0">
                                    {selectedEnvironment.address}
                                  </span>
                                  <Input 
                                    placeholder=":3000 (optional)" 
                                    className="font-mono text-xs border-0 focus-visible:ring-0 px-2 h-8"
                                    value={newVarSuffix}
                                    onChange={(e) => setNewVarSuffix(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddEnvVar()}
                                  />
                               </div>
                               <Button size="icon" variant="secondary" onClick={handleAddEnvVar}>
                                 <Plus className="h-4 w-4" />
                               </Button>
                            </div>

                            {Object.entries(envVars).length > 0 && (
                              <div className="rounded-md border bg-muted/10 divide-y">
                                {Object.entries(envVars).map(([key, value]) => (
                                  <div key={key} className="grid grid-cols-[1fr_1fr_auto] gap-2 p-2 items-center">
                                    <div className="font-mono text-xs font-medium truncate" title={key}>{key}</div>
                                    <div className="font-mono text-xs text-muted-foreground truncate" title={value}>{value}</div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleRemoveEnvVar(key)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-[13px] text-muted-foreground">
                            Variables are automatically prefixed with the environment's IP address ({selectedEnvironment.address}).
                            Add optional ports and paths (e.g., :3000/api) as needed. If left empty, it will point directly to the IP.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bindings Section */}
                    <section>
                      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                        Attached Bindings
                      </h3>
                      {selectedEnvironment.bindings.length === 0 ? (
                        <Card className="border-dashed bg-muted/30">
                          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <HardDrive className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                            <p className="font-medium">No bindings attached</p>
                            <p className="text-sm text-muted-foreground max-w-xs mt-1">
                              Go to the Projects page to attach a workspace or
                              base code to this environment.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {selectedEnvironment.bindings.map((binding) => (
                            <Card key={binding.targetPath} className="bg-card hover:border-primary/50 transition-colors">
                              <CardContent className="p-4 flex flex-col gap-3 relative group">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleUnassign(
                                      binding.targetPath,
                                      binding.targetLabel
                                    )
                                  }
                                  className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                
                                <div className="flex items-center gap-2 pr-6">
                                  <h4 className="font-medium truncate" title={binding.targetLabel}>
                                    {binding.targetLabel}
                                  </h4>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="shrink-0 text-[10px] h-5">
                                    {binding.projectName}
                                  </Badge>
                                  <Badge
                                    variant={
                                      binding.kind === "base"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="shrink-0 text-[10px] h-5"
                                  >
                                    {binding.kind === "base"
                                      ? "Base"
                                      : "Workspace"}
                                  </Badge>
                                </div>
                                
                                <p className="text-[10px] font-mono text-muted-foreground truncate border-t pt-2 mt-1" title={binding.targetPath}>
                                  {binding.targetPath}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <Settings2 className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="font-semibold text-lg text-foreground">
                  No Environment Selected
                </h3>
                <p className="max-w-sm mt-2">
                  Select an environment from the tabs above or create a new one to get
                  started with isolated networking.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create Environment
                </Button>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Environment</DialogTitle>
            <DialogDescription>
              Update the display name for this environment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename">Name</Label>
              <Input
                id="rename"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameEnvironment();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameEnvironment}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!environmentToDelete}
        onOpenChange={(open) => !open && setEnvironmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the loopback alias{" "}
              <span className="font-mono font-semibold">
                {environmentToDelete?.address}
              </span>{" "}
              and detach all bindings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnvironment}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
