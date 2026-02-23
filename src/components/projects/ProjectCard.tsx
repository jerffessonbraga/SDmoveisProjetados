import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  client: string;
  status: "draft" | "in_progress" | "review" | "completed";
  value: number;
  createdAt: Date;
  thumbnail?: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  in_progress: "Em Andamento",
  review: "Em Revisão",
  completed: "Concluído",
};

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    {project.thumbnail && (
      <div className="h-40 bg-muted overflow-hidden">
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
      </div>
    )}
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{project.name}</h3>
        <Badge variant="secondary">{statusLabels[project.status] || project.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{project.client}</p>
      <p className="text-sm font-bold">{formatCurrency(project.value)}</p>
    </div>
  </Card>
);
