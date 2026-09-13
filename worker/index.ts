import { validateTransaction, type TransactionInput } from "../shared/transactions";

interface Environment {
  DB: D1Database;
}

function json(value: unknown, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export default {
  async fetch(request, environment): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health") {
        if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, { Allow: "GET" });
        await environment.DB.prepare("SELECT 1").first();
        return json({ status: "ok" });
      }
      if (url.pathname !== "/api/transactions") return json({ error: "Not found" }, 404);
      if (request.method === "GET") {
        const { results } = await environment.DB.prepare(
          `SELECT id, type, amount_cents AS amountCents, date, category, description
           FROM transactions ORDER BY date DESC, created_at DESC, id DESC LIMIT 100`,
        ).all();
        return json({ transactions: results });
      }
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
      if (request.headers.get("Origin") && request.headers.get("Origin") !== url.origin) return json({ error: "Invalid origin" }, 403);
      if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return json({ error: "Send JSON." }, 415);
      let input: unknown;
      try {
        input = await request.json();
      } catch {
        return json({ error: "Invalid JSON." }, 400);
      }
      const error = validateTransaction(input);
      if (error) return json({ error }, 400);
      const transaction = input as TransactionInput;
      const id = crypto.randomUUID();
      const description = transaction.description.trim();
      await environment.DB.prepare(
        "INSERT INTO transactions (id, type, amount_cents, date, category, description) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(id, transaction.type, transaction.amountCents, transaction.date, transaction.category, description).run();
      return json({ transaction: { id, type: transaction.type, amountCents: transaction.amountCents, date: transaction.date, category: transaction.category, description } }, 201);
    } catch {
      // Keep database internals out of public responses.
      return json({ error: "Service unavailable. Please try again." }, 503);
    }
  },
} satisfies ExportedHandler<Environment>;
