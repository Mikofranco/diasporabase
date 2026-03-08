"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onAgree: () => void;
}

export function TermsModal({
  open,
  onOpenChange,
  title,
  children,
  onAgree,
}: TermsModalProps) {
  const handleAgree = () => {
    onAgree();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1E293B] pr-8">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4 pt-2">
          {children}
        </div>
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleAgree}
            className="min-w-[120px] bg-[#0ea5e9] text-white hover:bg-[#0284c7] border border-border shadow-none"
          >
            I Agree
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgencyTermsContent() {
  return (
    <>
      <p className="text-foreground font-medium">
        By checking &quot;I agree,&quot; we confirm:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed">
        <li>
          <strong>Volunteer support:</strong> Volunteers are donating their time,
          knowledge, and skillset. They are not DiasporaBase staff, and not our
          employees/contractors through the platform.
        </li>
        <li>
          <strong>No solicitation / no payments:</strong> We will not request
          or accept money, gifts, or fees from volunteers. We will report any
          solicitation attempts.
        </li>
        <li>
          <strong>Clear scope:</strong> We will post projects with clear goals,
          timelines, and deliverables.
        </li>
        <li>
          <strong>We own deliverables:</strong> Deliverables provided through
          the project belong to our institution once delivered (unless a
          separate written agreement says otherwise).
        </li>
        <li>
          <strong>No guaranteed maintenance:</strong> Volunteers are not
          obligated to provide ongoing support or maintenance after delivery
          unless they independently choose to.
        </li>
        <li>
          <strong>DiasporaBase limitation:</strong> DiasporaBase is a
          matching/collaboration platform and is not responsible for
          maintenance, ongoing operation, or disputes between users.
        </li>
      </ul>
    </>
  );
}

export function VolunteerTermsContent() {
  return (
    <>
      <p className="text-foreground font-medium">
        By checking &quot;I agree,&quot; I confirm:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed">
        <li>
          <strong>Volunteer only:</strong> I&apos;m donating my time, knowledge
          and skills. I am not an employee/contractor of DiasporaBase or any
          agency.
        </li>
        <li>
          <strong>No money:</strong> I will not send or request money, gifts,
          &quot;fees,&quot; or payments of any kind. Solicitation is prohibited.
        </li>
        <li>
          <strong>Report requests:</strong> If anyone asks me for money or
          anything of value, I will report it to DiasporaBase immediately.
        </li>
        <li>
          <strong>Agency owns deliverables:</strong> Work I create for an agency
          through a DiasporaBase project belongs to the agency/institution once
          delivered (unless a separate written agreement says otherwise).
        </li>
        <li>
          <strong>I can reference, not own:</strong> I may describe my
          contribution in a resume/portfolio without sharing confidential info,
          but I won&apos;t claim ownership of agency deliverables.
        </li>
        <li>
          <strong>Confidentiality:</strong> I won&apos;t share non-public,
          confidential project information.
        </li>
        <li>
          <strong>Platform role:</strong> DiasporaBase connects users and is not
          responsible for project outcomes or disputes between users.
        </li>
      </ul>
    </>
  );
}
