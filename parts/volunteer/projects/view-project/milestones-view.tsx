// components/project/MilestonesView.tsx
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Target, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: "pending" | "in_progress" | "completed";
  created_at?: string;
}

interface MilestonesViewProps {
  milestones: Milestone[];
}

export default function MilestonesView({ milestones }: MilestonesViewProps) {
  if (milestones.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="py-16 text-center text-muted-foreground">
          No milestones defined yet.
        </div>
      </Card>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return { icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-green-100 text-green-800" };
      case "in_progress":
        return { icon: <Clock className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" };
      default:
        return { icon: <AlertCircle className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" };
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {milestones.map((m) => {
        const status = getStatusConfig(m.status);

        return (
          <AccordionItem key={m.id} value={m.id} className="border rounded-lg mb-4 overflow-hidden">
            <AccordionTrigger className="px-6 py-2 hover:no-underline bg-muted/30 hover:bg-muted/50 transition">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-4 text-left">
                  <Target className="h-6 w-6 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold">{m.title}</h3>
                    {m.due_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Due {format(new Date(m.due_date), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className={`${status.color} flex items-center gap-1.5`}>
                  {status.icon}
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1).replace("_", " ")}
                </Badge>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-6 pt-2 bg-background">
              {m.description ? (
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{m.description}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}
              {m.created_at && (
                <p className="text-xs text-muted-foreground/70 mt-4">
                  Created on {format(new Date(m.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}