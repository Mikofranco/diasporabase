"use client";

import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Mail, Users, BookOpen, MessageCircle, Heart } from "lucide-react";

const SuccessStoriesPage = () => {
  const stories = [
    {
      name: "Sarah Johnson",
      role: "CEO, TechStart Inc.",
      company: "TechStart",
      quote: "The platform connected us with passionate volunteers who helped launch our community program in just 3 months. We've impacted over 5,000 lives already!",
      avatar: "/avatars/sarah.jpg",
      fallback: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Project Lead, GreenEarth NGO",
      company: "GreenEarth",
      quote: "Finding skilled volunteers used to take weeks. Now we get qualified applicants within days. Our tree-planting initiative scaled 300% this year.",
      avatar: "/avatars/michael.jpg",
      fallback: "MC",
    },
    {
      name: "Aisha Patel",
      role: "Founder, EduFuture",
      company: "EduFuture",
      quote: "The matching system is incredible. We found educators who truly care about our mission. Our literacy program now reaches 12 rural communities.",
      avatar: "/avatars/aisha.jpg",
      fallback: "AP",
    },
    {
      name: "David Ramirez",
      role: "Director, HealthBridge",
      company: "HealthBridge",
      quote: "During crisis response, we needed medical volunteers fast. This platform delivered — we assembled a team of 50 professionals in under 48 hours.",
      avatar: "/avatars/david.jpg",
      fallback: "DR",
    },
    {
      name: "Emma Thompson",
      role: "Coordinator, YouthEmpower",
      company: "YouthEmpower",
      quote: "The tools made managing 200+ volunteers seamless. We ran our largest mentorship program ever with zero administrative headaches.",
      avatar: "/avatars/emma.jpg",
      fallback: "ET",
    },
    {
      name: "James Okonkwo",
      role: "Founder, SkillShare Africa",
      company: "SkillShare",
      quote: "We've trained over 2,000 youth in digital skills thanks to expert volunteers from around the world. This platform changed everything for us.",
      avatar: "/avatars/james.jpg",
      fallback: "JO",
    },
  ];

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Real Impact, Real Stories
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how organizations and volunteers are creating meaningful change together through our platform.
          </p>
        </section>

        {/* Success Stories Grid */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Card
                key={story.name}
                className="hover:shadow-lg transition-shadow duration-300 bg-card border-border"
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
                <CardContent>
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{story.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action Sections */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Share Your Story */}
              <Card className="text-center p-8 bg-amber-50">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4 fill-red-400 text-red-500" />
                <h3 className="text-2xl font-bold mb-3">Share Your Success Story</h3>
                <p className="text-muted-foreground mb-6">
                  Inspire others by sharing how you've made an impact.
                </p>
                <Button asChild className="action-btn">
                  <a href="/contact">Tell Your Story</a>
                </Button>
              </Card>

              {/* Join Community */}
              <Card className="text-center p-8 bg-teal-50">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Join Our Community</h3>
                <p className="text-muted-foreground mb-6">
                  Connect with like-minded changemakers and stay inspired.
                </p>
                <Button variant="outline" asChild>
                  <a href="/community">Join Now</a>
                </Button>
              </Card>

              {/* Read Blog */}
              <Card className="text-center p-8 bg-lime-50">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Explore More Stories</h3>
                <p className="text-muted-foreground mb-6">
                  Dive deeper into impact stories on our blog.
                </p>
                <Button variant="outline" asChild>
                  <a href="/blog">Visit Blog</a>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Mail className="h-12 w-12 mx-auto mb-6 text-[#0EA5E9]" />
          <h2 className="text-3xl font-bold mb-4">Stay Inspired</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to receive new success stories, impact updates, and opportunities to make a difference.
          </p>
          <Button size="lg" asChild className="action-btn">
            <a href="/subscribe">Subscribe to Newsletter</a>
          </Button>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SuccessStoriesPage;