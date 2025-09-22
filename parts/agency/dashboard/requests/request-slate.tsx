"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Check, X } from "lucide-react";

interface RequestSlateProps {
  applicantName: string;
  projectTitle: string;
  onAccept: () => void;
  onDecline: () => void;
}

const RequestSlate: React.FC<RequestSlateProps> = ({
  applicantName = "Sarah Johnson",
  projectTitle = "Town Clean Up",
  onAccept,
  onDecline,
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <User
              className="h-8 w-8 text-[#0284C7] dark:text-blue-400"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {applicantName}
              </h3>
              <p
                className="text-gray-600 dark:text-gray-400 text-sm"
                id={`request-description-${applicantName.replace(/\s+/g, "-")}`}
              >
                Applied for {projectTitle}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              onClick={onAccept}
              aria-label={`Accept application for ${applicantName}`}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 font-medium"
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                Accept
              </motion.span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
              onClick={onDecline}
              aria-label={`Decline application for ${applicantName}`}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 text-medium"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                Decline
              </motion.span>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RequestSlate;