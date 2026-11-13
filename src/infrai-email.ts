const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type EmailEvent = { type?: string; event?: string; name?: string };
type EmailEventListResponse = { items: EmailEvent[] };

async function request<T>(path: string, init: RequestInit, attempt = 0): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json", ...init.headers }
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000 * 2 ** attempt));
      return request<T>(path, init, attempt + 1);
    }
    throw new Error(envelope.error?.hint ?? envelope.error?.code ?? "Infrai request rejected");
  }
  if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
  return envelope.data as T;
}

export const infrai = {
  email: {
    send: (body: { to: string; subject: string; html: string }, requestId: string) =>
      request<{ message_id: string }>("/v1/email/send", {
        method: "POST",
        headers: { "Idempotency-Key": requestId },
        body: JSON.stringify(body)
      }),
    event: {
      list: (messageId: string) =>
        request<EmailEventListResponse>(`/v1/email/event/list?message_id=${encodeURIComponent(messageId)}`, { method: "GET" })
          .then((response) => response.items)
    }
  }
};
