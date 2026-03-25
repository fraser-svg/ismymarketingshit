import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { voiceGapPipeline } from "@/lib/pipeline";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [voiceGapPipeline],
});
