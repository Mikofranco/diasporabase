"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Users, Building2, CheckCircle2 } from "lucide-react";

const WHY_PROFESSIONALS = [
  { title: "Give Back, Your Way", text: "Mentor, consult, or contribute remotely." },
  { title: "Trusted Connections", text: "Engage with verified organizations securely." },
  { title: "Real Impact", text: "Drive progress in education, healthcare, and more." },
] as const;

const WHY_INSTITUTIONS = [
  { title: "Access Global Talent", text: "Connect with experts at no cost." },
  { title: "Solve Local Challenges", text: "Address technical and resource gaps." },
  { title: "Transparent Collaboration", text: "Track projects with accountability." },
] as const;

const HOW_IT_WORKS = [
  { step: 1, title: "Join the Platform", desc: "Sign up as a professional or institution/NGO." },
  { step: 2, title: "Match with Purpose", desc: "Connect with projects that align with your skills." },
  { step: 3, title: "Collaborate Virtually", desc: "Work remotely with transparent tracking." },
  { step: 4, title: "Create Change", desc: "Drive impact in policy, health, and more." },
] as const;

export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <NavBar />

      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center overflow-hidden mt-16"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(14, 165, 233, 0.35), rgba(15, 23, 42, 0.85)), url('https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/business-people-collaborating-office-working-project-together_709984-8661.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-black/20" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center text-white px-4 py-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Global Talent, Local Impact
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-8 leading-relaxed">
            Empowering diaspora professionals to drive change in their home
            countries—no relocation required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              data-modal-trigger="select-signup-type-modal"
              className="rounded-xl px-6 py-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
            >
              Get Started
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl px-6 py-6 text-base font-semibold bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60"
            >
              <Link href={routes.LearnMore}>Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Why DiasporaBase */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white tracking-tight mb-4">
            Why DiasporaBase?
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-12">
            One platform connecting talent and institutions across borders.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <span className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-600 dark:text-cyan-400">
                  <Users className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  For Diaspora Professionals
                </h3>
              </div>
              <ul className="space-y-3">
                {WHY_PROFESSIONALS.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" aria-hidden />
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong className="text-gray-900 dark:text-white">{item.title}:</strong> {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <span className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-600 dark:text-cyan-400">
                  <Building2 className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  For Governments & NGOs
                </h3>
              </div>
              <ul className="space-y-3">
                {WHY_INSTITUTIONS.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" aria-hidden />
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong className="text-gray-900 dark:text-white">{item.title}:</strong> {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-white dark:bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
            DiasporaBase unlocks the potential of global talent for local
            progress. We provide a secure, structured platform for diaspora
            professionals to collaborate with institutions in their home
            countries, driving innovation and sustainable change.
          </p>
          <p className="text-xl md:text-2xl font-semibold text-cyan-600 dark:text-cyan-400">
            “Expertise knows no borders.”
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-12">
            Four steps to start making an impact.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4 bg-gray-100 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
            Join the Movement
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Ready to make a difference? Connect, collaborate, and transform lives
            with DiasporaBase—no passport needed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              data-modal-trigger="select-signup-type-modal"
              className="rounded-xl px-6 py-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg"
            >
              Get Started Now
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-6 py-6 text-base font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700">
              <Link href={routes.LearnMore}>Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
