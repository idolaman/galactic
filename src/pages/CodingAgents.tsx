import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Activity, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface AgentStatus {
  id: string;
  project: string;
  workspace: string;
  status: "active" | "idle" | "error";
  lastActivity: string;
  tasksCompleted: number;
}

const mockAgents: AgentStatus[] = [
  {
    id: "1",
    project: "my-app",
    workspace: "feature/new-ui",
    status: "active",
    lastActivity: "2 minutes ago",
    tasksCompleted: 12,
  },
  {
    id: "2",
    project: "my-app",
    workspace: "bugfix/login",
    status: "idle",
    lastActivity: "15 minutes ago",
    tasksCompleted: 8,
  },
  {
    id: "3",
    project: "backend-api",
    workspace: "feature/auth",
    status: "active",
    lastActivity: "Just now",
    tasksCompleted: 23,
  },
  {
    id: "4",
    project: "backend-api",
    workspace: "refactor/database",
    status: "error",
    lastActivity: "5 minutes ago",
    tasksCompleted: 5,
  },
];

const statusConfig = {
  active: {
    icon: Activity,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  idle: {
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
};

export default function CodingAgents() {
  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coding Agents</h1>
          <p className="text-sm text-muted-foreground">
            Monitor AI coding agents across all your workspaces
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">48</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Agents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            All Agents
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockAgents.map((agent) => {
              const config = statusConfig[agent.status];
              const StatusIcon = config.icon;
              
              return (
                <Card
                  key={agent.id}
                  className={`p-6 bg-card border ${config.borderColor}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="font-mono text-xs mb-1">
                          {agent.project}
                        </Badge>
                        <code className="text-xs text-muted-foreground block">
                          {agent.workspace}
                        </code>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-3 py-1 rounded ${config.bgColor}`}>
                        <StatusIcon className={`h-3 w-3 ${config.color}`} />
                        <span className={`text-xs font-medium ${config.color} capitalize`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Activity</p>
                        <p className="text-sm font-medium">{agent.lastActivity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tasks Completed</p>
                        <p className="text-sm font-medium">{agent.tasksCompleted}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
