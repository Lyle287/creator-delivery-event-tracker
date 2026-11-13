import { z } from "zod";
import { infrai, type EmailEvent } from "./infrai-email.ts";

export const campaignRequest = z.object({
  subscriber: z.string().email(),
  creator: z.string().min(1),
  assetTitle: z.string().min(1),
  downloadUrl: z.string().url()
});

export type CampaignRequest = z.infer<typeof campaignRequest>;
export type DeliveryState = "sent" | "opened" | "bounced";

export function classifyEvents(events: EmailEvent[]): DeliveryState {
  const names = events.map((event) => String(event.type ?? event.event ?? event.name ?? "").toLowerCase());
  if (names.some((name) => name.includes("bounce"))) return "bounced";
  if (names.some((name) => name.includes("open"))) return "opened";
  return "sent";
}

export async function deliverAsset(input: unknown) {
  const request = campaignRequest.parse(input);
  const sent = await infrai.email.send({
    to: request.subscriber,
    subject: `${request.creator} shared ${request.assetTitle}`,
    html: `<p>Your asset is ready: <a href="${request.downloadUrl}">${request.assetTitle}</a></p>`
  }, `creator-asset:${request.subscriber}:${request.assetTitle}`);
  const events = await infrai.email.event.list(sent.message_id);
  return { messageId: sent.message_id, state: classifyEvents(events) };
}
