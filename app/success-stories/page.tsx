"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Quote, Mail, Users, BookOpen, Heart } from "lucide-react";
import { routes } from "@/lib/routes";

const STORIES = [
  {
    id: "sarah",
    name: "Sarah Johnson",
    role: "CEO, TechStart Inc.",
    company: "TechStart",
    quote:
      "The platform connected us with passionate volunteers who helped launch our community program in just 3 months. We've impacted over 5,000 lives already!",
    avatar: "/avatars/sarah.jpg",
    fallback: "SJ",
  },
] as const;

export default function SuccessStoriesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-cyan-500/10 via-white to-blue-500/10 dark:from-cyan-500/5 dark:via-gray-900 dark:to-blue-500/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="container mx-auto px-4 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4">
            <Quote className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Real Impact, Real Stories
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Discover how organizations and volunteers are creating meaningful
            change together through our platform.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container mx-auto px-4 pb-16 md:pb-24 -mt-6 relative z-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {STORIES.map((story) => (
            <Card
              key={story.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 rounded-xl">
                    <AvatarImage src={story.avatar} alt={story.name} />
                    <AvatarFallback className="rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      {story.fallback}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {story.name}
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      {story.role} at {story.company}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Quote className="h-8 w-8 text-cyan-500/20 dark:text-cyan-400/20 mb-3" aria-hidden />
                <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex flex-col h-full overflow-hidden">
            <CardContent className="p-8 flex flex-col flex-1 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto mb-4">
                <Heart className="h-7 w-7" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Share Your Success Story
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 flex-1">
                Inspire others by sharing how you&apos;ve made an impact.
              </p>
              <Button asChild className="rounded-xl action-btn w-full">
                <Link href={routes.contact}>Tell Your Story</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex flex-col h-full overflow-hidden">
            <CardContent className="p-8 flex flex-col flex-1 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto mb-4">
                <Users className="h-7 w-7" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Join Our Community
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 flex-1">
                Connect with like-minded change makers and stay inspired.
              </p>
              <Button asChild variant="outline" className="rounded-xl w-full border-2">
                <Link href={routes.registerVolunteer}>Join Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex flex-col h-full overflow-hidden">
            <CardContent className="p-8 flex flex-col flex-1 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto mb-4">
                <BookOpen className="h-7 w-7" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Creating Projects
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 flex-1">
                Post opportunities and find volunteers for your institution.
              </p>
              <Button asChild variant="outline" className="rounded-xl w-full border-2">
                <Link href={routes.registerAgency}>Start Now</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-8 md:p-12 max-w-2xl mx-auto shadow-sm"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto mb-4">
            <Mail className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Stay Inspired
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Subscribe to receive new success stories, impact updates, and
            opportunities to make a difference.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-xl action-btn">
                Subscribe to Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  Subscribe to Our Newsletter
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400">
                  Get the latest success stories, updates, and volunteer
                  opportunities delivered to your inbox.
                </DialogDescription>
              </DialogHeader>
              <p className="text-center text-lg font-semibold text-cyan-600 dark:text-cyan-400 py-4">
                Coming soon
              </p>
            </DialogContent>
          </Dialog>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
