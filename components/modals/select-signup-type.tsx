import React from "react";
import Modal from "../ui/modal";
import { Button } from "../ui/button";
import { routes } from "@/lib/routes";

const SelectSignUpType = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <Modal
      id="select-signup-type-modal"
      isOpen={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      className="max-w-md"
    >
      <Modal.Body className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-bold text-2xl text-primary flex items-center gap-2">
            <span className="inline-block bg-blue-100 text-blue-600 p-2 rounded-full">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9.5 10.5v1a2.5 2.5 0 0 0 5 0v-1a2.5 2.5 0 0 0-5 0Zm-2 .5a5 5 0 1 1 9.999.001A5 5 0 0 1 7.5 11ZM12 17v1m-7 2c0-2.209 3.134-4 7-4s7 1.791 7 4c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1Z"></path></svg>
            </span>
            Select Sign Up Type
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close modal"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-red-500 focus:outline-none"
          >
            <svg width="22" height="22" aria-hidden="true" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/></svg>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 items-stretch w-full">
          <a
            href={routes.registerVolunteer}
            className="flex items-center gap-4 bg-white hover:bg-blue-50 text-blue-800 border-2 border-blue-100 shadow transition rounded-xl px-5 py-4 focus-visible:ring-2 focus-visible:ring-blue-300 duration-150 group"
          >
            <span className="flex items-center justify-center bg-blue-100 group-hover:bg-blue-200 rounded-full h-12 w-12 transition">
              <svg height="26" width="26" fill="none" viewBox="0 0 24 24">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#2563eb" strokeWidth="2"/>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <div>
              <span className="font-medium text-lg block">
                Sign Up as Volunteer
              </span>
              <span className="block text-sm text-muted-foreground">
                For individuals seeking to contribute to projects.
              </span>
            </div>
          </a>
          <a
            href={routes.registerAgency}
            className="flex items-center gap-4 bg-white hover:bg-green-50 text-green-800 border-2 border-green-100 shadow transition rounded-xl px-5 py-4 focus-visible:ring-2 focus-visible:ring-green-300 duration-150 group"
          >
            <span className="flex items-center justify-center bg-green-100 group-hover:bg-green-200 rounded-full h-12 w-12 transition">
              <svg height="26" width="26" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="10" width="18" height="8" rx="2" stroke="#22c55e" strokeWidth="2"/>
                <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="#22c55e" strokeWidth="2"/>
                <path d="M16 14h.01M12 14h.01M8 14h.01" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <div>
              <span className="font-medium text-lg block">
                Sign Up as Government Agency
              </span>
              <span className="block text-sm text-muted-foreground">
                For organizations or official agencies staffing projects.
              </span>
            </div>
          </a>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SelectSignUpType;
