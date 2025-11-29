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
  const [configHostVar, setConfigHostVar] = useState("");
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
      setConfigHostVar(selectedEnvironment.hostVariable || "");
    }
  }, [selectedEnvironment]);

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

  const handleSaveConfig = async () => {
    if (!selectedEnvironment) return;
    
    const trimmedHostVar = configHostVar.trim();

    // Only update if changes were made
    if (trimmedHostVar === (selectedEnvironment.hostVariable || "")) {
      return;
    }

    const result = await updateEnvironment(selectedEnvironment.id, {
      hostVariable: trimmedHostVar,
    });

    if (!result.success) {
      toast({
        title: "Failed to update",
        description: result.error || "Unknown error.",
        variant: "destructive",
      });
      // Reset to previous valid state
      setConfigHostVar(selectedEnvironment.hostVariable || "");
      return;
    }

    // Update all .code-workspace files for bindings to this environment
    const updatePromises = selectedEnvironment.bindings.map(async (binding) => {
      await writeCodeWorkspace(binding.targetPath, {
        hostVariable: trimmedHostVar,
        address: selectedEnvironment.address,
      });
      markWorkspaceRequiresRelaunch(binding.targetPath);
    });
    await Promise.all(updatePromises);

    toast({ title: "Settings saved", description: "Environment configuration updated." });
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

  const handleUnassign = (targetPath: string, targetLabel: string) => {
    unassignTarget(targetPath);
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
                        <div className="space-y-3">
                          <Label htmlFor="config-host" className="text-sm font-medium">
                            Host Variable Name
                          </Label>
                          <div className="flex items-center gap-3 max-w-md">
                            <Input
                              id="config-host"
                              value={configHostVar}
                              placeholder="HOST"
                              onChange={(e) => setConfigHostVar(e.target.value)}
                              onBlur={handleSaveConfig}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveConfig()}
                              className="font-mono"
                            />
                            <span className="text-muted-foreground text-sm shrink-0">
                              = {selectedEnvironment.address}
                            </span>
                          </div>
                          <p className="text-[13px] text-muted-foreground leading-relaxed">
                            This environment variable will be injected into your editor. 
                            Your application must read <code className="font-mono font-medium text-foreground">{configHostVar || "HOST"}</code> to bind the services to the correct local IP.
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-sm font-medium">Usage Example</Label>
                          <div className="p-3 rounded bg-muted/50 border font-mono text-xs space-y-1">
                            <div className="text-muted-foreground"># Example: Node.js / Express</div>
                            <div>
                              <span className="text-purple-600 dark:text-purple-400">const</span> host = process.env.{configHostVar || "HOST"} || <span className="text-green-600 dark:text-green-400">"0.0.0.0"</span>;
                            </div>
                            <div>
                              app.listen(port, <span className="font-bold text-foreground">host</span>, () ={">"} {"{"} ... {"}"});
                            </div>
                          </div>
                          <p className="text-[13px] text-muted-foreground">
                            <strong>Important:</strong> Do not bind to <code className="font-mono">localhost</code> or <code className="font-mono">127.0.0.1</code>. Always use the variable.
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
