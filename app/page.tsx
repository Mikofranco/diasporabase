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

// Animation variants for the hero section's glass container
const heroVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

// Animation variants for buttons (staggered entrance)
const buttonVariants = {
  hidden: { opacity: 0, x: -20 },//@ts-ignore
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" },
  }),
};

// Animation variants for feature cards
const featureVariants = {
  hidden: { opacity: 0, y: 30 },//@ts-ignore
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

// Animation variants for CTA section
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
        <section
          className="w-full py-12 md:py-24 lg:py-32 xl:py-48 h-[80vh] relative bg-cover bg-center bg-no-repeat"
          style={{
            background:
              "linear-gradient(90deg, rgba(14, 165, 233, 0.7) 0%, rgba(59, 7, 100, 0.7) 100%), url('https://diasporabase.com/About.PNG') no-repeat center/cover",
          }}
          aria-labelledby="hero-heading"
        >
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              className="flex flex-col items-center space-y-6 text-center"
              initial="hidden"
              animate="visible"//@ts-ignore
              variants={heroVariants}
            >
              <motion.div
                className="space-y-4 bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-lg border border-white/20 max-w-[800px] mx-auto"//@ts-ignore
                variants={heroVariants}
              >
                <h1
                  id="hero-heading"
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-lg"
                >
                  Connect Volunteers with Opportunities
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl drop-shadow-md">
                  Empowering communities by uniting passionate volunteers with
                  impactful organizations. Discover, participate, and make a
                  difference.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row justify-center">
                  <motion.div
                    custom={0}
                    initial="hidden"
                    animate="visible"//@ts-ignore
                    variants={buttonVariants}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  >
                    <Link href="/projects" aria-label="Browse volunteer projects">
                      <Button
                        size="lg"
                        className="min-w-[200px] bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 text-white font-semibold shadow-lg"
                      >
                        Browse Projects
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    custom={1}
                    initial="hidden"
                    animate="visible"//@ts-ignore
                    variants={buttonVariants}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  >
                    <Link
                      href="/register-volunteer"
                      aria-label="Join as a volunteer"
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="min-w-[200px] bg-white/80 hover:bg-white text-gray-800 font-semibold shadow-lg border-2 border-white/50"
                      >
                        Join as Volunteer
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
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
                  icon: <Users className="h-12 w-12 text-primary" aria-hidden="true" />,
                  title: "For Volunteers",
                  description:
                    "Discover opportunities that align with your skills and passions. Track your impact and connect with like-minded individuals.",
                },
                {
                  icon: <Building className="h-12 w-12 text-primary" aria-hidden="true" />,
                  title: "For Organizations",
                  description:
                    "Post projects, manage volunteers, and track progress. Build strong community relationships.",
                },
                {
                  icon: <Star className="h-12 w-12 text-primary" aria-hidden="true" />,
                  title: "Community Ratings",
                  description:
                    "Share experiences and help others find great volunteer opportunities through reviews.",
                },
                {
                  icon: <MessageCircle className="h-12 w-12 text-primary" aria-hidden="true" />,
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
                  viewport={{ once: true, amount: 0.3 }}//@ts-ignore
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
          viewport={{ once: true, amount: 0.3 }}//@ts-ignore
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
    </div>
  );
}