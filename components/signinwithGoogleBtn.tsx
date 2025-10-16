import React from "react";
import { Button } from "./ui/button";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/config/firebase";
import { supabase } from "@/lib/supabase/client";

// Simple Google G logo SVG icon
const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-label="Google"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const SignUpWithGoogleBtn = () => {
  const signUpWithGoogle = async () => {
    try {
      // Step 1: Sign in with Firebase
      const results = await signInWithPopup(auth, provider);

      const authInfo = {
        userId: results.user.uid,
        name: results.user.displayName,
        email: results.user.email,
        profilePhoto: results.user.photoURL,
        isAuth: true,
      };

      localStorage.setItem("auth", JSON.stringify(authInfo));

      // Step 2: Sign up the same user on Supabase (optional)
      const { data: signupData, error: signupError } =
        await supabase.auth.signUp({
          email: results?.user.email,
          password: results?.user?.uid,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              full_name: results?.user.displayName,
              role: "volunteer",
              // phone: formData.phone,
              email: results?.user.email,
            },
          }, // You might want to handle this differently (Firebase handles auth)
        });

      if (signupError) {
        console.error("Supabase signup error:", signupError.message);
      } else {
        console.log("Supabase signup success:", signupData);
      }

      console.log("Firebase user:", results.user);
    } catch (error) {
      console.error("Error signing up with Google:", error);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={signUpWithGoogle}
      className="w-full gap-2 justify-center my-4"
    >
      <GoogleIcon />
      Sign up with Google
    </Button>
  );
};

export default SignUpWithGoogleBtn;
