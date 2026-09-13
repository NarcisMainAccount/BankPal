export const categories = ["Groceries", "Transport", "Housing", "Bills", "Health", "Entertainment", "Salary", "Other"] as const;

export interface TransactionInput {
  type: "income" | "expense";
  amountCents: number;
  date: string;
  category: string;
  description: string;
}

export interface Transaction extends TransactionInput {
  id: string;
}

export function parseAmount(amount: string): number | null {
  if (!/^\d{1,9}([.,]\d{1,2})?$/.test(amount.trim())) return null;
  const [euros, cents = ""] = amount.trim().replace(",", ".").split(".");
  const result = Number(euros) * 100 + Number(cents.padEnd(2, "0"));
  return result > 0 ? result : null;
}

export function validateTransaction(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Invalid transaction.";
  const transaction = value as Record<string, unknown>;
  if (transaction.type !== "income" && transaction.type !== "expense") return "Choose income or expense.";
  if (!Number.isSafeInteger(transaction.amountCents) || Number(transaction.amountCents) <= 0 || Number(transaction.amountCents) > 99999999999) return "Enter a valid positive amount.";
  if (typeof transaction.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) return "Choose a valid date.";
  const date = new Date(transaction.date + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== transaction.date) return "Choose a valid date.";
  if (!categories.includes(transaction.category as typeof categories[number])) return "Choose a category.";
  if (typeof transaction.description !== "string" || transaction.description.length > 200) return "Description must be 200 characters or fewer.";
  return null;
}
