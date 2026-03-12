import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

const heliusEventSchema = z.object({
  type: z.string().min(2),
  signature: z.string().optional(),
  account: z.string().optional(),
  data: z.unknown().optional(),
});

const heliusPayloadSchema = z.union([heliusEventSchema, z.array(heliusEventSchema)]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = heliusPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Helius payload tidak valid",
      },
      { status: 400 },
    );
  }

  const events = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  events.forEach((event) => {
    phase2MockDb.appendAuditEvent({
      source: "helius",
      type: event.type,
      payload: event,
    });
  });

  return NextResponse.json({
    ok: true,
    received: events.length,
    message: "Webhook event tersimpan (mock mode).",
  });
}
