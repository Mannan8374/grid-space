"use server";

import { z } from "zod";

import { FormSchema } from "../types";
import { createClient } from "../supabase/server";

/**
 * Login with email + password.
 * Used in (auth)/login/page.tsx
 */
export async function actionLoginUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // IMPORTANT: return only JSON-serializable data to the client
  if (error) {
    return {
      error: {
        message: error.message,
      },
    };
  }

  return { error: null };
}

/**
 * Sign up with email + password.
 * Used in (auth)/signup/page.tsx
 */
export async function actionSignUpUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      error: {
        message: error.message,
      },
    };
  }

  return { error: null };
}

/**
 * Fetch the current authenticated user for SupabaseUserProvider.
 *
 * The login/signup pages expect:
 *   const { data: { user } } = await getuser();
 *
 * Again: only return JSON-serializable data.
 */
export async function getuser() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    // log on server, but don't send the error object to the client
    console.error("Error getting Supabase session:", error);
  }

  const sessionUser = data?.session?.user ?? null;

  // Force a plain JSON copy of the user object (no class prototypes)
  const user = sessionUser
    ? JSON.parse(JSON.stringify(sessionUser))
    : null;

  return { data: { user } };
}
