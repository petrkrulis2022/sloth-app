# Perplexity AI Integration Setup

## Problem: CORS Restrictions

The Perplexity AI API cannot be called directly from the browser due to CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature that prevents API keys from being exposed in client-side code.

## Solution: Supabase Edge Function

To enable AI chat functionality, you need to create a Supabase Edge Function that acts as a proxy between your frontend and the Perplexity API.

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Initialize Supabase Functions

```bash
cd /path/to/sloth.app
supabase init
supabase functions new perplexity-chat
```

### Step 3: Create the Edge Function

Create `supabase/functions/perplexity-chat/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { messages, model, apiKey } = await req.json();

    // Validate input
    if (!messages || !model || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Perplexity API
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
```

### Step 4: Deploy the Edge Function

```bash
# Link to your Supabase project
supabase link --project-ref ogrbtmbmxyqyvwkajdrw

# Deploy the function
supabase functions deploy perplexity-chat
```

### Step 5: Update Frontend Code

Modify `src/services/ai/aiService.ts` to use the Edge Function instead of calling Perplexity directly:

```typescript
// Replace the Perplexity client usage with Edge Function call
export async function chat(
  messages: ChatMessage[],
  model: AIModel,
  systemPrompt: string,
  userId: string,
  projectId?: string
): Promise<AIResponse<ChatResponse>> {
  try {
    const userApiKey = await getDecryptedApiKey(userId);
    const apiKey = userApiKey || import.meta.env.VITE_PERPLEXITY_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "NO_API_KEY",
        message: "No Perplexity API key configured.",
      };
    }

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Call Supabase Edge Function instead of Perplexity directly
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perplexity-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          apiKey,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const completion = await response.json();
    return { success: true, data: completion as ChatResponse };
  } catch (error: unknown) {
    console.error("AI chat error:", error);
    return {
      success: false,
      error: "API_ERROR",
      message: "AI assistant is temporarily unavailable.",
    };
  }
}
```

### Step 6: Test

1. Make sure your Edge Function is deployed
2. Restart your development server
3. Try sending a message in the AI chat box

## Alternative: Local Development

For local development, you can run the Edge Function locally:

```bash
supabase functions serve perplexity-chat
```

Then update your `.env` to point to the local function:

```
VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

## Security Notes

- Never commit API keys to your repository
- The Edge Function keeps API keys secure on the server side
- User-specific API keys are encrypted in the database
- The Edge Function validates all requests before forwarding to Perplexity

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Perplexity AI API Documentation](https://docs.perplexity.ai/)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
