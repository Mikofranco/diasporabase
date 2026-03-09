"use client";

import React from "react";
import Modal from "../ui/modal";
import { Button } from "../ui/button";
import { routes } from "@/lib/routes";
import { User, Building2, X } from "lucide-react";

const signupOptions = [
  {
    href: routes.registerVolunteer,
    title: "Sign Up as Volunteer",
    description: "For individuals seeking to contribute to projects.",
    icon: User,
  },
  {
    href: routes.registerAgency,
    title: "Sign Up as Government Agency",
    description: "For organizations or official agencies staffing projects.",
    icon: Building2,
  },
] as const;

const SelectSignUpType = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <Modal
      id="select-signup-type-modal"
      isOpen={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      className="max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden dark:bg-card"
    >
      <Modal.Body className="p-6 md:p-8">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <User className="h-5 w-5" />
            </span>
            <h2 className="font-bold text-xl sm:text-2xl text-foreground">
              Choose how to get started
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close modal"
            onClick={() => setOpen(false)}
            className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          Select the option that best describes you to continue registration.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {signupOptions.map(({ href, title, description, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="
                flex items-center gap-4
                rounded-xl border border-border bg-muted/50
                hover:bg-muted hover:border-cyan-500/40
                dark:bg-muted/30 dark:hover:border-cyan-400/40
                px-5 py-4
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2
                group
              "
            >
              <span
                className="
                  flex items-center justify-center
                  h-12 w-12 rounded-xl
                  bg-gradient-to-br from-cyan-500 to-blue-600
                  text-white
                  group-hover:shadow-md group-hover:shadow-cyan-500/20
                  transition-shadow duration-200
                "
              >
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <span className="font-semibold text-base text-foreground block">
                  {title}
                </span>
                <span className="block text-sm text-muted-foreground mt-0.5">
                  {description}
                </span>
              </div>
            </a>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SelectSignUpType;
