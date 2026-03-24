import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";

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

  for (const event of events) {
    await dbService.appendAuditEvent({
      source: "helius",
      type: event.type,
      payload: event,
    });
  }

  return NextResponse.json({
    ok: true,
    received: events.length,
    message: "Webhook event tersimpan.",
  });
}
