// components/project/DeliverablesView.tsx
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Package, Download, Calendar } from "lucide-react";

interface Deliverable {
  id: string;
  title: string;
  description?: string;
  submitted_at?: string;
  file_url?: string;
  created_at?: string;
}

interface DeliverablesViewProps {
  deliverables: Deliverable[];
}

export default function DeliverablesView({ deliverables }: DeliverablesViewProps) {
  if (deliverables.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="py-16 text-center text-muted-foreground">
          No deliverables submitted yet.
        </div>
      </Card>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {deliverables.map((d) => (
        <AccordionItem key={d.id} value={d.id} className="border rounded-lg mb-4 overflow-hidden">
          <AccordionTrigger className="px-6 py-2 hover:no-underline bg-muted/30 hover:bg-muted/50 transition">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-4 text-left">
                <Package className="h-6 w-6 text-purple-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold">{d.title}</h3>
                  {d.submitted_at && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Submitted {format(new Date(d.submitted_at), "MMMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              {d.file_url && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Ready to download
                </Badge>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-2 bg-background">
            <div className="space-y-4">
              {d.description ? (
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{d.description}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}

              {d.file_url && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </a>
                </Button>
              )}

              {d.created_at && (
                <p className="text-xs text-muted-foreground/70">
                  Created on {format(new Date(d.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}