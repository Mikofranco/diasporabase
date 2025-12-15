"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mountain, Users, Building, Star, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import StatsSection from "@/parts/landingPage/stats";
import TestimonialsSection from "@/parts/landingPage/testimonials";
import AboutUsSection from "@/parts/landingPage/about-us";
import SelectSignUpType from "@/components/modals/select-signup-type";

const heroVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, x: -20 }, //@ts-ignore
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" },
  }),
};

const featureVariants = {
  hidden: { opacity: 0, y: 30 }, //@ts-ignore
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

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
            backgroundImage: `
      linear-gradient(to bottom, rgba(14, 165, 233, 0.4), rgba(59, 7, 100, 0.8)),
      url('https://diasporabase.com/About.PNG')
    `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed", 
          }}
        >
          {/* Optional subtle animated overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

          {/* Glassmorphic Content Card – Perfectly Centered */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 mx-6 max-w-5xl w-full"
          >
            <div
              className="
        backdrop-blur-xl bg-white/10 
        border border-white/20 
        rounded-3xl shadow-2xl 
        p-10 md:p-16 lg:p-20 
        text-center 
        ring-1 ring-white/30
        shadow-black/20
      "
            >
              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl"
              >
                Welcome to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                  DiasporaBase
                </span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-100 font-light max-w-3xl mx-auto drop-shadow-lg leading-relaxed"
              >
                Lead change in your home country —{" "}
                <br className="hidden sm:block" />
                from anywhere in the world.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center"
              >
                <Link href="/projects">
                  <Button
                    size="lg"
                    className="
              min-w-[220px] px-10 py-7 text-lg font-bold
              bg-gradient-to-r from-cyan-500 to-blue-600
              hover:from-cyan-400 hover:to-blue-500
              shadow-xl hover:shadow-2xl
              transform hover:scale-105 transition-all duration-300
              border border-white/30
            "
                  >
                    Browse Projects
                  </Button>
                </Link>

                <Link href="/register-volunteer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="
              min-w-[220px] px-10 py-7 text-lg font-bold
              bg-white/20 backdrop-blur-md
              text-white border-2 border-white/40
              hover:bg-white/30 hover:border-white/60
              shadow-xl hover:shadow-2xl
              transform hover:scale-105 transition-all duration-300
            "
                  >
                    Join as Volunteer
                  </Button>
                </Link>
              </motion.div>

              {/* Optional Trust Indicator */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="mt-10 text-sm text-gray-300 font-medium tracking-wider"
              >
                Trusted by volunteers in 47+ countries
              </motion.p>
            </div>
          </motion.div>

          {/* Bottom fade gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>

        <StatsSection />

        {/* Features Section */}
        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800"
          aria-labelledby="features-heading"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <h2
              id="features-heading"
              className="text-3xl font-bold tracking-tighter text-center mb-12"
            >
              Why Choose Us
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: (
                    <Users
                      className="h-12 w-12 text-primary"
                      aria-hidden="true"
                    />
                  ),
                  title: "For Volunteers",
                  description:
                    "Discover opportunities that align with your skills and passions. Track your impact and connect with like-minded individuals.",
                },
                {
                  icon: (
                    <Building
                      className="h-12 w-12 text-primary"
                      aria-hidden="true"
                    />
                  ),
                  title: "For Organizations",
                  description:
                    "Post projects, manage volunteers, and track progress. Build strong community relationships.",
                },
                {
                  icon: (
                    <Star
                      className="h-12 w-12 text-primary"
                      aria-hidden="true"
                    />
                  ),
                  title: "Community Ratings",
                  description:
                    "Share experiences and help others find great volunteer opportunities through reviews.",
                },
                {
                  icon: (
                    <MessageCircle
                      className="h-12 w-12 text-primary"
                      aria-hidden="true"
                    />
                  ),
                  title: "Public Engagement",
                  description:
                    "Browse projects, provide feedback, and stay informed about community initiatives.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }} //@ts-ignore
                  variants={featureVariants}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 },
                  }}
                  className="flex flex-col items-center space-y-4 text-center p-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {feature.icon}
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <TestimonialsSection />
        <AboutUsSection />

        {/* CTA Section */}
        <motion.section
          className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
          aria-labelledby="cta-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }} //@ts-ignore
          variants={ctaVariants}
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h2
                  id="cta-heading"
                  className="text-3xl font-bold tracking-tighter md:text-4xl"
                >
                  Ready to Make a Difference?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Join thousands of volunteers and organizations transforming
                  communities worldwide.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register-volunteer"
                  aria-label="Start volunteering"
                >
                  <Button
                    size="lg"
                    className="min-w-[200px] bg-primary hover:bg-primary/90"
                  >
                    Start Volunteering
                  </Button>
                </Link>
                <Link
                  href="/register-agency"
                  aria-label="Register your organization"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-w-[200px] bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    Register Your Organization
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
      {/* <SelectSignUpType/> */}
    </div>
  );
}
