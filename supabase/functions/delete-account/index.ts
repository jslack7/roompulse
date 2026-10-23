

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const publishableKey =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function respond(
  data: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  try {
    // 1. Verify the caller's existing session.
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respond({ error: "You must be signed in." }, 401);
    }

    const accessToken = authorization.slice(7);

    const userClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: userData, error: userError } =
      await userClient.auth.getUser(accessToken);

    if (userError || !userData.user?.email) {
      return respond(
        { error: "Unable to verify your account." },
        401
      );
    }

    const organizerId = userData.user.id;
    const organizerEmail = userData.user.email;

    // 2. Require explicit confirmation and password.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return respond({ error: "Invalid request body." }, 400);
    }

    if (!body || typeof body !== "object") {
      return respond({ error: "Invalid request body." }, 400);
    }

    const { confirmation, password } = body as {
      confirmation?: unknown;
      password?: unknown;
    };

    if (confirmation !== "DELETE") {
      return respond(
        { error: "Please type DELETE to confirm." },
        400
      );
    }

    if (typeof password !== "string" || !password) {
      return respond(
        { error: "Please enter your password." },
        400
      );
    }

    // 3. Verify the password using a separate client.
    const verificationClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: passwordData,
      error: passwordError,
    } = await verificationClient.auth.signInWithPassword({
      email: organizerEmail,
      password,
    });

    if (
      passwordError ||
      passwordData.user?.id !== organizerId
    ) {
      return respond(
        { error: "Password verification failed." },
        401
      );
    }

    // 4. Use the service role only for authorized admin work.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // 5. Block deletion while any presentation is live.
    const { data: livePresentations, error: liveError } =
      await adminClient
        .from("presentations")
        .select("id")
        .eq("owner_id", organizerId)
        .eq("is_live", true)
        .limit(1);

    if (liveError) {
      return respond(
        { error: "Unable to check your presentations." },
        500
      );
    }

    if (livePresentations?.length) {
      return respond(
        {
          error:
            "Please end all live presentations before deleting your account.",
        },
        409
      );
    }

    // 6. Permanently delete the verified account.
    // Database foreign keys handle related data.
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(
        organizerId,
        false
      );

    if (deleteError) {
      console.error(
        "Account deletion failed:",
        deleteError.message
      );

      return respond(
        {
          error:
            "Account deletion failed. Check that all presentations are inactive.",
        },
        500
      );
    }

    return respond({
      message: "Your RoomPulse account has been deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return respond(
      { error: "An unexpected error occurred." },
      500
    );
  }
});
