import { useEffect, useState, type FormEvent } from "react";
import { categories, parseAmount, validateTransaction, type Transaction } from "../shared/transactions";

const currency = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function today() {
  const date = new Date();
  // Use the local calendar day, including near midnight.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function loadTransactions(): Promise<Transaction[]> {
  const response = await fetch("/api/transactions");
  if (!response.ok) throw new Error("Could not load transactions. Please retry.");
  return (await response.json()).transactions;
}

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    setLoadError("");
    try { setTransactions(await loadTransactions()); }
    catch (error) { setLoadError((error as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const transaction = {
      type: values.get("type"),
      amountCents: parseAmount(String(values.get("amount"))),
      date: values.get("date"),
      category: values.get("category"),
      description: String(values.get("description")).trim(),
    };
    setMessage("");
    const validationError = validateTransaction(transaction);
    setError(validationError ?? "");
    if (validationError) return;
    setSaving(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save transaction.");
      form.reset();
      setMessage("Transaction saved.");
      await refresh();
    } catch (error) {
      setError(error instanceof TypeError
        ? "Connection interrupted. Reload the list before retrying to check whether it saved."
        : (error as Error).message);
    } finally { setSaving(false); }
  }

  return (
    <main className="welcome">
      <p className="brand">BankPal</p>
      <h1>Your money, day by day.</h1>
      <section aria-labelledby="entry-title">
        <h2 id="entry-title">Add a transaction</h2>
        <form onSubmit={saveTransaction}>
          <fieldset disabled={saving}>
            <legend className="sr-only">Transaction details</legend>
            <label>Type<select name="type" defaultValue="expense"><option value="expense">Expense</option><option value="income">Income</option></select></label>
            <label>Amount (€)<input name="amount" inputMode="decimal" placeholder="0.00" required maxLength={12} /></label>
            <label>Date<input name="date" type="date" defaultValue={today()} required /></label>
            <label>Category<select name="category" defaultValue="" required><option value="" disabled>Choose a category</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
            <label>Description (optional)<input name="description" maxLength={200} /></label>
            <button type="submit">{saving ? "Saving…" : "Save transaction"}</button>
          </fieldset>
          {error && <p role="alert">{error}</p>}
          <p role="status">{message}</p>
        </form>
      </section>
      <section aria-labelledby="transactions-title" aria-busy={loading}>
        <h2 id="transactions-title">Recent transactions</h2>
        <p>Latest 100 entries, sorted by date.</p>
        {loading && <p role="status">Loading transactions…</p>}
        {loadError && <p role="alert">{loadError}</p>}
        <button type="button" onClick={() => void refresh()} disabled={loading || saving}>Refresh list</button>
        {!loading && !loadError && transactions.length === 0 && <p>No transactions yet. Add your first above.</p>}
        <ul className="transactions">
          {transactions.map(transaction => (
            <li key={transaction.id}>
              <div><strong>{transaction.description || transaction.category}</strong><small>{transaction.category} · <time dateTime={transaction.date}>{transaction.date}</time></small></div>
              <span className={transaction.type}>{transaction.type === "income" ? "+" : "−"}{currency.format(transaction.amountCents / 100)}<small>{transaction.type === "income" ? "Income" : "Expense"}</small></span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
