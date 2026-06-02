// @ts-nocheck
// =============================================================================
// AUTHENTICATION ENDPOINTS — Supabase Auth Integration
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// Initialize Supabase clients
const getSupabaseServiceClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

const getSupabaseAnonClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
};

// =============================================================================
// SIGN UP
// =============================================================================

export async function handleSignUp(c: any) {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseServiceClient();

    // Create user with admin API (bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Auto-confirm email since email server not configured
      email_confirm: true,
    });

    if (error) {
      console.error("[Auth] Sign up error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Sign in to get session
    const anonClient = getSupabaseAnonClient();
    const { data: sessionData, error: sessionError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      console.error("[Auth] Session creation error:", sessionError);
      return c.json({ error: sessionError.message }, 400);
    }

    return c.json({
      user: data.user,
      session: sessionData.session,
    });
  } catch (error: any) {
    console.error("[Auth] Sign up error:", error);
    return c.json({ error: error.message || "Sign up failed" }, 500);
  }
}

// =============================================================================
// SIGN IN
// =============================================================================

export async function handleSignIn(c: any) {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseAnonClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] Sign in error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    console.error("[Auth] Sign in error:", error);
    return c.json({ error: error.message || "Sign in failed" }, 500);
  }
}

// =============================================================================
// SIGN OUT
// =============================================================================

export async function handleSignOut(c: any) {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAnonClient();

    // Verify token and sign out
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error("[Auth] Sign out error:", error);
      // Still return success even if token is invalid
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Auth] Sign out error:", error);
    return c.json({ error: error.message || "Sign out failed" }, 500);
  }
}

// =============================================================================
// OAUTH
// =============================================================================

export async function handleOAuth(c: any) {
  try {
    const body = await c.req.json();
    const { provider } = body;

    if (!provider) {
      return c.json({ error: "Provider is required" }, 400);
    }

    const supabase = getSupabaseAnonClient();

    // Get OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")}/auth/v1/callback`,
      },
    });

    if (error) {
      console.error("[Auth] OAuth error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ url: data.url });
  } catch (error: any) {
    console.error("[Auth] OAuth error:", error);
    return c.json({ error: error.message || "OAuth failed" }, 500);
  }
}

// =============================================================================
// REFRESH TOKEN
// =============================================================================

export async function handleRefreshToken(c: any) {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: "Refresh token is required" }, 400);
    }

    const supabase = getSupabaseAnonClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      console.error("[Auth] Refresh token error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ session: data.session });
  } catch (error: any) {
    console.error("[Auth] Refresh token error:", error);
    return c.json({ error: error.message || "Token refresh failed" }, 500);
  }
}

// =============================================================================
// UPDATE USER
// =============================================================================

export async function handleUpdateUser(c: any) {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const body = await c.req.json();

    const supabase = getSupabaseServiceClient();

    // Get user from token
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !currentUser) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(
      currentUser.id,
      { user_metadata: body }
    );

    if (error) {
      console.error("[Auth] Update user error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error: any) {
    console.error("[Auth] Update user error:", error);
    return c.json({ error: error.message || "Update failed" }, 500);
  }
}

// =============================================================================
// PASSWORD RESET
// =============================================================================

export async function handlePasswordReset(c: any) {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = getSupabaseAnonClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${Deno.env.get("SUPABASE_URL")}/auth/v1/callback`,
    });

    if (error) {
      console.error("[Auth] Password reset error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Auth] Password reset error:", error);
    return c.json({ error: error.message || "Password reset failed" }, 500);
  }
}

// =============================================================================
// UPDATE PASSWORD
// =============================================================================

export async function handleUpdatePassword(c: any) {
  try {
    const body = await c.req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return c.json({ error: "Token and new password are required" }, 400);
    }

    const supabase = getSupabaseServiceClient();

    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      console.error("[Auth] Update password error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Auth] Update password error:", error);
    return c.json({ error: error.message || "Password update failed" }, 500);
  }
}
