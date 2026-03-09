"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { routes } from "@/lib/routes";
import { HelpCircle, Mail } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "password-reset",
    question: "How do I reset my password?",
    answer: "To reset your password, visit our password reset page where you can enter your email and follow the instructions sent to you.",
    link: { href: routes.forgotPassword, label: "Go to Reset Password Page" },
  },
  {
    id: "contact-support",
    question: "How do I contact customer support?",
    answer: "You can reach our support team by sending an email or filling out our contact form. We're here to help!",
    link: { href: "mailto:support@diasporabase.com", label: "Email support@diasporabase.com", external: true },
  },
] as const;

export default function HelpCenterPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-cyan-500/10 via-white to-blue-500/10 dark:from-cyan-500/5 dark:via-gray-900 dark:to-blue-500/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="container mx-auto px-4 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4">
            <HelpCircle className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Help Center
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Find quick answers to common questions or get in touch with our support team.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container mx-auto px-4 pb-16 md:pb-24 -mt-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-0 text-gray-600 dark:text-gray-400">
                    <p className="mb-4">{item.answer}</p>
                    <Link
                      href={item.link.href}
                      target={item.link.external ? "_blank" : undefined}
                      rel={item.link.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
                    >
                      {item.link.external && <Mail className="h-4 w-4" />}
                      {item.link.label}
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Need More Help?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Our support team is available to assist with any other questions or issues.
          </p>
          <Button asChild className="rounded-xl action-btn shadow-lg">
            <Link href={routes.contact}>Contact Support</Link>
          </Button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
