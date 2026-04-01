import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { voiceGapPipeline } from "@/lib/pipeline";

// Each Inngest step runs as a separate invocation of this route.
// Claude API calls can take 30-50s, so we need the max timeout.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [voiceGapPipeline],
});
