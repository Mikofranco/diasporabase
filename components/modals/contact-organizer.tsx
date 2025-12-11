// components/modals/contact-organizer.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Globe,
  Building2,
  User,
  MessageCircle,
} from "lucide-react";
import { sendEmail } from "@/lib/email";
import { OrganizationContact } from "@/lib/types";
import Modal from "../ui/modal";

interface ContactOrganizationModalProps {
  project: {
    id: string;
    title: string | undefined;
  };
  organization: OrganizationContact;
  trigger?: React.ReactNode;
}

export default function ContactOrganizationModal({
  project,
  organization,
  trigger,
}: ContactOrganizationModalProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fullName =
    `${organization.contact_person_first_name || ""} ${
      organization.contact_person_last_name || ""
    }`.trim() || "the team";

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please write a message first.");
      return;
    }

    if (
      !organization.contact_person_email &&
      !organization.contact_person_phone
    ) {
      toast.error("This organization has no contact email or phone.");
      return;
    }

    setSending(true);

    //     try {
    //       // Use your existing sendEmail function
    //       await sendEmail({
    //         to: organization.contact_person_email || "no-reply@yourapp.com",
    //         subject: `New message from volunteer about "${project.title}"`,
    //         text: `
    // Volunteer Message:
    // "${message.trim()}"

    // Project: ${project.title}
    // Volunteer: ${fullName} (you will see their email in your inbox)
    //         `.trim(),
    //         html: `
    //           <div style="font-family: system-ui, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 12px;">
    //             <h2>New Message About Your Project</h2>
    //             <p><strong>Project:</strong> ${project.title}</p>
    //             <p><strong>From volunteer:</strong> ${fullName}</p>
    //             <hr style="margin: 20px 0; border: 1px solid #eee;" />
    //             <blockquote style="background: white; padding: 16px; border-left: 4px solid #3b82f6; margin: 16px 0;">
    //               ${message.trim().replace(/\n/g, "<br>")}
    //             </blockquote>
    //             <p>You can reply directly to this email to respond.</p>
    //           </div>
    //         `.trim(),
    //       });

    //       toast.success("Message sent successfully! The organization will reply soon.");
    //       setMessage("");
    //       setOpen(false);
    //     } catch (err: any) {
    //       console.error("Failed to send email:", err);
    //       toast.error(err.message || "Failed to send message. Try again later.");
    //     } finally {
    //       setSending(false);
    //     }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <MessageCircle className="h-4 w-4" />
      Contact Organizer
    </Button>
  );

  return (
    <Modal
      id="contact-organization-modal"
      onOpen={() => setOpen(true)}
      isOpen={open}
      onClose={() => setOpen(false)}
    >
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || defaultTrigger}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Contact Organization</DialogTitle>
            <DialogDescription>
              Send a message to the organizers of{" "}
              <strong>{project.title}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Organization Details */}
          <div className="space-y-6 py-4 border-b pb-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-10 w-10 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">
                  {organization.organization_name || "Unknown Organization"}
                </h3>
                {organization.organization_type && (
                  <p className="text-sm text-muted-foreground">
                    {organization.organization_type}
                  </p>
                )}
              </div>
            </div>

            {organization.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {organization.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {organization.contact_person_first_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {organization.contact_person_first_name}{" "}
                    {organization.contact_person_last_name}
                  </span>
                </div>
              )}

              {organization.contact_person_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${organization.contact_person_email}`}
                    className="text-primary hover:underline"
                  >
                    {organization.contact_person_email}
                  </a>
                </div>
              )}

              {organization.contact_person_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${organization.contact_person_phone}`}
                    className="text-primary hover:underline"
                  >
                    {organization.contact_person_phone}
                  </a>
                </div>
              )}

              {organization.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Message Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder={`Hi ${fullName}, I'd like to ask about...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground">
                Your message will be sent via email. The organization can reply
                directly to you.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="gap-2"
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Modal>
  );
}
