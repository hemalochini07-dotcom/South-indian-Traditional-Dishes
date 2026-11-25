
import { useEffect, useState, type FormEvent } from "react";
import type { UserRole } from "./Login";
import { apiGet, apiPost, apiPut } from "./api";

type Payment = {
  id: number;
  paymentNo: string;
  invoiceNo: string;
  customer: string;
  amount: number;
  method: string;
  date: string;
  status: "Completed" | "Pending";
};

type BackendPayment = {
  id: number;
  payment_no: string;
  invoice_no: string;
  customer: string;
  amount: number | string;
  method: string;
  date: string;
  status: "Completed" | "Pending";
};

type PaymentsProps = {
  role: UserRole;
};

function mapPayment(item: BackendPayment): Payment {
  return {
    id: item.id,
    paymentNo: item.payment_no,
    invoiceNo: item.invoice_no,
    customer: item.customer,
    amount: Number(item.amount),
    method: item.method,
    date: item.date,
    status: item.status,
  };
}

function Payments({ role }: PaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendPayment[]>("/payments");

      setPayments(data.map(mapPayment));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleAddPayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const paymentAmount = Number(amount);

    if (!invoiceNo.trim() || !customer.trim()) {
      alert("Please enter invoice and customer details.");
      return;
    }

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      paymentAmount > 100000000
    ) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const nextNumber =
      Math.max(
        0,
        ...payments.map((payment) => {
          const match = payment.paymentNo.match(/PAY-(\d+)/);
          return match ? Number(match[1]) : 0;
        })
      ) + 1;

    const paymentNumber =
      `PAY-${String(nextNumber).padStart(3, "0")}`;

    try {
      setSaving(true);
      setError("");

      const savedPayment = await apiPost<BackendPayment>(
        "/payments",
        {
          payment_no: paymentNumber,
          invoice_no: invoiceNo.trim(),
          customer: customer.trim(),
          amount: paymentAmount,
          method,
          date: new Date().toISOString().slice(0, 10),
          status: "Completed",
        }
      );

      setPayments((previous) => [
        mapPayment(savedPayment),
        ...previous,
      ]);

      setInvoiceNo("");
      setCustomer("");
      setAmount("");

      alert("Payment recorded successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record payment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePaymentStatus(id: number) {
    const payment = payments.find((item) => item.id === id);

    if (!payment || payment.status !== "Pending") return;

    try {
      setUpdatingId(id);
      setError("");

      const updatedPayment = await apiPut<BackendPayment>(
        `/payments/${id}`,
        { status: "Completed" }
      );

      setPayments((previous) =>
        previous.map((item) =>
          item.id === id ? mapPayment(updatedPayment) : item
        )
      );

      alert("Payment marked as completed!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update payment status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredPayments = payments.filter((payment) =>
    `${payment.paymentNo} ${payment.invoiceNo} ${payment.customer}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalReceived = payments
    .filter((payment) => payment.status === "Completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="products-page">
      <div className="page-heading">
        <div>
          <h1>Payment Management</h1>
          <p>Track customer payments and outstanding amounts.</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon">💰</div>
          <div>
            <p>Total Received</p>
            <h2>₹{totalReceived.toFixed(2)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">⏳</div>
          <div>
            <p>Pending Amount</p>
            <h2>₹{pendingAmount.toFixed(2)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🧾</div>
          <div>
            <p>Total Transactions</p>
            <h2>{payments.length}</h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {role === "Admin" && (
        <div className="product-form-card">
          <h2>Record Customer Payment</h2>

          <form onSubmit={handleAddPayment}>
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Example: INV-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Customer Name</label>
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Amount (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  max="100000000"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || loading}
            >
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </form>
        </div>
      )}

      <div className="product-form-card">
        <h2>Payment History</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payment, invoice or customer..."
        />

        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Payment No.</th>
                <th>Invoice No.</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                {role === "Admin" && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.paymentNo}</td>
                    <td>{payment.invoiceNo}</td>
                    <td>{payment.customer}</td>
                    <td>₹{payment.amount.toFixed(2)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.date}</td>
                    <td>{payment.status}</td>

                    {role === "Admin" && (
                      <td>
                        {payment.status === "Pending" ? (
                          <button
                            className="secondary-button"
                            type="button"
                            disabled={updatingId === payment.id}
                            onClick={() =>
                              updatePaymentStatus(payment.id)
                            }
                          >
                            {updatingId === payment.id
                              ? "Updating..."
                              : "Mark Completed"}
                          </button>
                        ) : (
                          "Completed"
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Payments;
