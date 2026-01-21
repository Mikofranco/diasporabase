"use client";

import { useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // ← shadcn dialog
import { Input } from "@/components/ui/input"; // for email field
import { Label } from "@/components/ui/label";
import {
  Quote,
  Mail,
  Users,
  BookOpen,
  MessageCircle,
  Heart,
} from "lucide-react";

const SuccessStoriesPage = () => {
  const stories = [
    // ... your stories array remains unchanged
    {
      name: "Sarah Johnson",
      role: "CEO, TechStart Inc.",
      company: "TechStart",
      quote:
        "The platform connected us with passionate volunteers who helped launch our community program in just 3 months. We've impacted over 5,000 lives already!",
      avatar: "/avatars/sarah.jpg",
      fallback: "SJ",
    },
    // ... other entries ...
  ];

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-background">
        {/* Hero Section - unchanged */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Real Impact, Real Stories
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how organizations and volunteers are creating meaningful
            change together through our platform.
          </p>
        </section>

        {/* Success Stories Grid - unchanged */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Card
                key={story.name}
                className="hover:shadow-lg transition-shadow duration-300 bg-card border-border flex flex-col h-full"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={story.avatar} alt={story.name} />
                      <AvatarFallback>{story.fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{story.name}</CardTitle>
                      <CardDescription>
                        {story.role} at {story.company}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{story.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action Sections – now with equal height & bottom-aligned buttons */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Each card now uses flex-col + h-full + flex-1/mt-auto pattern */}

              <Card className="text-center p-8 bg-amber-50 flex flex-col h-full">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4 fill-red-400 text-red-500" />
                <h3 className="text-2xl font-bold mb-3">
                  Share Your Success Story
                </h3>
                <p className="text-muted-foreground mb-6 flex-1">
                  Inspire others by sharing how you've made an impact.
                </p>
                <CardFooter className="mt-auto justify-center pt-0">
                  <Button asChild className="action-btn">
                    <a href="/contact">Tell Your Story</a>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="text-center p-8 bg-teal-50 flex flex-col h-full">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Join Our Community</h3>
                <p className="text-muted-foreground mb-6 flex-1">
                  Connect with like-minded changemakers and stay inspired.
                </p>
                <CardFooter className="mt-auto justify-center pt-0">
                  <Button variant="outline" asChild>
                    <a href="/community">Join Now</a>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="text-center p-8 bg-lime-50 flex flex-col h-full">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">
                  Explore More Stories
                </h3>
                <p className="text-muted-foreground mb-6 flex-1">
                  Dive deeper into impact stories on our blog.
                </p>
                <CardFooter className="mt-auto justify-center pt-0">
                  <Button variant="outline" asChild>
                    <a href="/blog">Visit Blog</a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter CTA – now opens Dialog */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Mail className="h-12 w-12 mx-auto mb-6 text-[#0EA5E9]" />
          <h2 className="text-3xl font-bold mb-4">Stay Inspired</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to receive new success stories, impact updates, and
            opportunities to make a difference.
          </p>


          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="action-btn">
                Subscribe to Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Subscribe to Our Newsletter</DialogTitle>
                <DialogDescription>
                  Get the latest success stories, updates, and volunteer
                  opportunities delivered to your inbox.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="action-btn">Subscribe</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SuccessStoriesPage;