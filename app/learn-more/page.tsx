"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Globe,
  Briefcase,
  UserCircle,
} from "lucide-react";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { routes } from "@/lib/routes";

const KEY_FEATURES = [
  {
    id: "feature-1",
    title: "Virtual Project Collaboration",
    content:
      "Join dedicated project boards to collaborate on tasks, track milestones, and share documents. Each project includes clear objectives, timelines, and deliverables for seamless virtual teamwork.",
  },
  {
    id: "feature-2",
    title: "Smart Project Matching",
    content:
      "Our platform uses your skills, availability, and preferred regions to match you with relevant development projects, ensuring you contribute where it matters most.",
  },
  {
    id: "feature-3",
    title: "Citizen Engagement",
    content:
      "Citizens can monitor projects, upload photos or videos of on-ground progress, and provide feedback, fostering transparency and accountability.",
  },
  {
    id: "feature-4",
    title: "Anonymity Options",
    content:
      "Diaspora professionals can choose to remain anonymous to the public, protecting personal information while sharing expertise and project contributions.",
  },
  {
    id: "feature-5",
    title: "Real-Time Analytics",
    content:
      "Access dashboards with insights on project progress, volunteer activity, and impact metrics, tailored for each country instance.",
  },
] as const;

const STAKEHOLDERS = [
  {
    id: "diaspora",
    title: "Diaspora Professionals",
    description:
      "Contribute your expertise to your home country from anywhere in the world. Build your impact through virtual volunteering and earn recognition for your work.",
    icon: Globe,
  },
  {
    id: "government",
    title: "Government Institutions",
    description:
      "Access skilled diaspora talent to support development projects, with verified profiles and transparent project management tools.",
    icon: Briefcase,
  },
  {
    id: "citizens",
    title: "Citizens",
    description:
      "Monitor local projects, share feedback, and ensure accountability by uploading evidence of on-ground progress.",
    icon: UserCircle,
  },
] as const;

export default function LearnMore() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <section
        className="relative min-h-[50vh] flex items-center justify-center overflow-hidden mt-16"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(14, 165, 233, 0.4), rgba(15, 23, 42, 0.85)), url('https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/business-people-collaborating-office-working-project-together_709984-8661.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-black/20" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center text-white px-4 py-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            DiasporaBase: Global Impact, Local Roots
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-8 leading-relaxed">
            Connect diaspora professionals with their home countries to drive
            meaningful development through virtual volunteering and collaboration.
          </p>
          <Button
            data-modal-trigger="select-signup-type-modal"
            className="rounded-xl px-6 py-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 inline-flex items-center gap-2"
          >
            Get Started <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </motion.div>
      </section>

      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white tracking-tight mb-4">
            Key Features
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
            Everything you need to collaborate and drive impact.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden"
          >
            <Accordion type="single" collapsible className="w-full">
              {KEY_FEATURES.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-0 px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-gray-900 dark:text-white font-medium">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pt-0 text-gray-600 dark:text-gray-400">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 bg-white dark:bg-gray-800/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white tracking-tight mb-4">
            Who Benefits from DiasporaBase?
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-12">
            Every stakeholder gains from transparent, skills-based collaboration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STAKEHOLDERS.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  <Card className="h-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-600 dark:text-cyan-400">
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {item.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 bg-gray-100 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Join DiasporaBase today to connect, collaborate, and drive impactful
            change in your home country.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="rounded-xl action-btn shadow-lg">
              <Link href={routes.registerVolunteer}>Sign Up as a Volunteer</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl border-2">
              <Link href={routes.contact}>Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
