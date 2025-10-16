"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import SigninWithGoogleBtn from "./signinwithGoogleBtn";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 8;

  useEffect(() => {//@ts-ignore
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()//@ts-ignore
          .then(({ data: profile, error: profileError }) => {
            console.log("Profile Response (onAuthStateChange):", { profile, error: profileError });
            if (profileError || !profile?.role) {
              console.error("Profile Error:", profileError?.message);
              setMessage({ text: "Profile not found. Please contact support.", isError: true });
              setLoading(false);
              return;
            }
            toast.success("Logged in successfully!")
            // setMessage({ text: "Logged in successfully!", isError: false });
            console.log("Redirecting to:", `/dashboard/${profile.role}`);
            localStorage.setItem("diaspobase_role", profile.role);
            router.replace(`/dashboard/${profile.role}`);
            
          });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    // Client-side validation
    if (!isValidEmail(email)) {
      setMessage({ text: "Please enter a valid email address.", isError: true });
      setLoading(false);
      return;
    }
    if (!isValidPassword(password)) {
      setMessage({ text: "Password must be at least 8 characters long.", isError: true });
      setLoading(false);
      return;
    }

    // Perform login
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("SignIn Response:", { data, error: signInError });

    if (signInError) {
      console.error("SignIn Error:", signInError.message);
      toast.error(signInError.message)
      setMessage({ text: signInError.message, isError: true });
      setLoading(false);
      return;
    }

    // Let onAuthStateChange handle the redirect
    setLoading(false);

  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4" aria-live="polite">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Login"
            )}
          </Button>
          {message && (
            <p
              className={`text-center text-sm ${message.isError ? "text-red-500" : "text-green-500"}`}
              aria-live="assertive"
            >
              {message.text}
            </p>
          )}
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register-volunteer" className="underline">
              Register as Volunteer
            </Link>{" "}
            or{" "}
            <Link href="/register-agency" className="underline">
              Register as Agency
            </Link>
          </div>
        </form>
          <SigninWithGoogleBtn/>
      </CardContent>
    </Card>
  );
}