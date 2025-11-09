import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Environment {
  id: string;
  name: string;
  workspaces: Array<{ project: string; workspace: string }>;
}

export default function Environments() {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: "1",
      name: "Development",
      workspaces: [
        { project: "my-app", workspace: "feature/new-ui" },
        { project: "backend-api", workspace: "feature/auth" },
      ],
    },
    {
      id: "2",
      name: "Testing",
      workspaces: [{ project: "my-app", workspace: "bugfix/login" }],
    },
  ]);
  const [newEnvName, setNewEnvName] = useState("");
  const { toast } = useToast();

  const handleCreateEnvironment = () => {
    if (!newEnvName.trim()) return;
    
    const newEnv: Environment = {
      id: Date.now().toString(),
      name: newEnvName,
      workspaces: [],
    };
    
    setEnvironments([...environments, newEnv]);
    setNewEnvName("");
    
    toast({
      title: "Environment created",
      description: `${newEnvName} is ready to use`,
    });
  };

  const handleDeleteEnvironment = (id: string) => {
    setEnvironments(environments.filter(env => env.id !== id));
    toast({
      title: "Environment deleted",
      description: "Environment has been removed",
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Environments</h1>
          <p className="text-sm text-muted-foreground">
            Manage isolated environments for your workspaces. Run multiple services with the same ports across different environments.
          </p>
        </div>

        {/* Create New Environment */}
        <Card className="p-4 bg-card border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Environment name..."
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateEnvironment()}
              className="flex-1"
            />
            <Button onClick={handleCreateEnvironment} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        </Card>

        {/* Environments List */}
        <div className="space-y-4">
          {environments.map((env) => (
            <Card key={env.id} className="p-6 bg-card border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{env.name}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEnvironment(env.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Active Workspaces ({env.workspaces.length})
                </p>
                {env.workspaces.length > 0 ? (
                  <div className="space-y-1">
                    {env.workspaces.map((ws, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm bg-muted/30 px-3 py-2 rounded"
                      >
                        <Badge variant="secondary" className="font-mono text-xs">
                          {ws.project}
                        </Badge>
                        <span className="text-muted-foreground">/</span>
                        <code className="text-xs">{ws.workspace}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No workspaces assigned to this environment
                  </p>
                )}
              </div>
            </Card>
          ))}

          {environments.length === 0 && (
            <Card className="p-8 bg-secondary/50 border-border text-center">
              <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No environments created yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
