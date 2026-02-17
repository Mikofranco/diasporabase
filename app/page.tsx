"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Building, Star, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import StatsSection from "@/parts/landingPage/stats";
import TestimonialsSection from "@/parts/landingPage/testimonials";
import AboutUsSection from "@/parts/landingPage/about-us";
import { routes } from "@/lib/routes";

const featureVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const FEATURES = [
  {
    id: "volunteers",
    title: "For Volunteers",
    description:
      "Support projects in your home country that align with your skills and passions. Track your impact and connect with like-minded professionals.",
    icon: Users,
  },
  {
    id: "organizations",
    title: "For Organizations",
    description:
      "Post projects, manage volunteers, and track progress. Build strong community relationships.",
    icon: Building,
  },
  {
    id: "ratings",
    title: "Community Ratings",
    description:
      "Share experiences and help others find great volunteer opportunities through reviews.",
    icon: Star,
  },
  {
    id: "engagement",
    title: "Public Engagement",
    description:
      "Browse projects, provide feedback, and stay informed about community initiatives.",
    icon: MessageCircle,
  },
] as const;

const iconClass = "h-10 w-10 text-cyan-600 dark:text-cyan-400";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <NavBar />
      <main className="flex-1">
        {/* Hero Section */}
        {/* Hero Section – Glassmorphic Center Masterpiece */}
        <section
          className="relative w-full h-screen sm:h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(14, 165, 233, 0.4), rgba(59, 7, 100, 0.8)), url('https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/group-afro-americans-working-together%20(1).jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/25" />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 mx-6 max-w-5xl w-full"
          >
            <div className="backdrop-blur-xl bg-white/15 border border-white/25 rounded-3xl shadow-2xl shadow-black/25 p-10 md:p-16 lg:p-20 text-center ring-1 ring-white/20">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.7 }}
                className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-lg"
              >
                Welcome to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-cyan-100">
                  DiasporaBase
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.7 }}
                className="mt-6 text-lg sm:text-xl md:text-2xl text-white/95 font-light max-w-2xl mx-auto leading-relaxed"
              >
                Lead change in your home country —
                <br className="hidden sm:block" />
                from anywhere in the world.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link href={routes.generalProjectsView}>
                  <Button
                    size="default"
                    className="min-w-[200px] px-6 py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-0"
                  >
                    Browse Projects
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  data-modal-trigger="select-signup-type-modal"
                  className="min-w-[200px] px-6 py-6 text-base font-semibold rounded-xl bg-white/15 backdrop-blur-md text-white border-2 border-white/40 hover:bg-white/25 hover:border-white/60 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Get Started
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </section>

        <StatsSection />

        {/* Features Section */}
        <section
          className="w-full py-16 md:py-24 lg:py-32 bg-gray-50/80 dark:bg-gray-800/80"
          aria-labelledby="features-heading"
        >
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <h2
              id="features-heading"
              className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 text-gray-900 dark:text-white"
            >
              Why Choose Us
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-12">
              One platform for volunteers, organizations, and communities.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={featureVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50 shadow-sm hover:shadow-md hover:border-cyan-500/20 dark:hover:border-cyan-400/20 transition-all duration-200"
                  >
                    <span className="rounded-2xl bg-cyan-500/10 dark:bg-cyan-400/10 p-3 text-cyan-600 dark:text-cyan-400">
                      <Icon className={iconClass} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <TestimonialsSection />
        <AboutUsSection />

        {/* CTA Section */}
        <motion.section
          className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
          aria-labelledby="cta-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={ctaVariants}
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-3">
                <h2
                  id="cta-heading"
                  className="text-3xl font-bold tracking-tight md:text-4xl text-gray-900 dark:text-white"
                >
                  Ready to Make a Difference?
                </h2>
                <p className="mx-auto max-w-[560px] text-gray-500 md:text-lg dark:text-gray-400 leading-relaxed">
                  Join thousands of volunteers and government agencies
                  transforming communities across Africa.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={routes.registerVolunteer}
                  aria-label="Start volunteering"
                >
                  <Button
                    size="lg"
                    className="min-w-[200px] rounded-xl action-btn shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Start Volunteering
                  </Button>
                </Link>
                <Link
                  href={routes.registerAgency}
                  aria-label="Register your organization"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-w-[200px] rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border-2"
                  >
                    Register a Government Agency
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}
