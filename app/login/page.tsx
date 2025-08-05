"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import AuthForm from "@/components/auth-form"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "auth_exchange_failed":
        return "Authentication failed. Please try logging in again."
      case "profile_not_found":
        return "User profile not found. Please contact support."
      case "no_role_assigned":
        return "No role assigned to your account. Please contact support."
      case "callback_failed":
        return "Login process failed. Please try again."
      case "no_auth_code":
        return "Invalid login attempt. Please try again."
      default:
        return "An error occurred during login. Please try again."
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {getErrorMessage(error)}
          </div>
        )}
        <AuthForm  />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
