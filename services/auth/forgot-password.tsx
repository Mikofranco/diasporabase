/**
 * Re-export the server action for password reset.
 * Do not use admin Supabase client in client bundles — the server action runs on the server only.
 */
export { sendCustomPasswordResetEmail } from "@/app/actions/reset-passeord";
