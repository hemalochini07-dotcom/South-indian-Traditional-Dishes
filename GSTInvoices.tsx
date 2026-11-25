
import { useEffect, useState, type FormEvent } from "react";
import type { UserRole } from "./Login";
import { apiGet, apiPost } from "./api";

type Invoice = {
  id: number;
  invoiceNo: string;
  customer: string;
  product: string;
  quantity: number;
  price: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  invoiceType: "Intra-state" | "Inter-state";
  date: string;
};

type BackendInvoice = {
  id: number;
  invoice_no: string;
  customer: string;
  product: string;
  quantity: number | string;
  price: number | string;
  taxable_amount: number | string;
  gst_rate: number | string;
  cgst: number | string;
  sgst: number | string;
  igst: number | string;
  total: number | string;
  invoice_type: "Intra-state" | "Inter-state";
  date: string;
};

type GSTInvoicesProps = {
  role: UserRole;
};

function mapInvoice(item: BackendInvoice): Invoice {
  return {
    id: item.id,
    invoiceNo: item.invoice_no,
    customer: item.customer,
    product: item.product,
    quantity: Number(item.quantity),
    price: Number(item.price),
    taxableAmount: Number(item.taxable_amount),
    gstRate: Number(item.gst_rate),
    cgst: Number(item.cgst),
    sgst: Number(item.sgst),
    igst: Number(item.igst),
    total: Number(item.total),
    invoiceType: item.invoice_type,
    date: item.date,
  };
}

function GSTInvoices({ role }: GSTInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("60");
  const [gstRate, setGstRate] = useState("5");

  const [invoiceType, setInvoiceType] =
    useState<"Intra-state" | "Inter-state">("Intra-state");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendInvoice[]>("/gst-invoices");

      setInvoices(data.map(mapInvoice));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invoices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const taxableAmount = Number(quantity) * Number(price);
  const gstAmount = taxableAmount * Number(gstRate) / 100;

  const cgst =
    invoiceType === "Intra-state" ? gstAmount / 2 : 0;

  const sgst =
    invoiceType === "Intra-state" ? gstAmount / 2 : 0;

  const igst =
    invoiceType === "Inter-state" ? gstAmount : 0;

  const total = taxableAmount + gstAmount;

  async function handleCreateInvoice(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!customer.trim() || !product.trim()) {
      alert("Please enter customer and product details.");
      return;
    }

    const quantityValue = Number(quantity);
    const priceValue = Number(price);
    const gstValue = Number(gstRate);

    if (
      !Number.isInteger(quantityValue) ||
      quantityValue <= 0 ||
      quantityValue > 10000 ||
      !Number.isFinite(priceValue) ||
      priceValue <= 0 ||
      !Number.isFinite(taxableAmount) ||
      !Number.isFinite(total) ||
      ![0, 5, 12, 18, 28].includes(gstValue)
    ) {
      alert("Please enter valid quantity, price and GST rate.");
      return;
    }

    const nextNumber =
      Math.max(
        0,
        ...invoices.map((invoice) => {
          const match = invoice.invoiceNo.match(/INV-(\d+)/);
          return match ? Number(match[1]) : 0;
        })
      ) + 1;

    const invoiceNumber =
      `INV-${String(nextNumber).padStart(3, "0")}`;

    try {
      setSaving(true);
      setError("");

      const savedInvoice = await apiPost<BackendInvoice>(
        "/gst-invoices",
        {
          invoice_no: invoiceNumber,
          customer: customer.trim(),
          product: product.trim(),
          quantity: quantityValue,
          price: priceValue,
          gst_rate: gstValue,
          invoice_type: invoiceType,
          date: new Date().toISOString().slice(0, 10),
        }
      );

      setInvoices((previous) => [
        mapInvoice(savedInvoice),
        ...previous,
      ]);

      setCustomer("");
      setProduct("");
      setQuantity("1");
      setPrice("60");

      alert("GST Invoice created successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create GST invoice."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredInvoices = invoices.filter((invoice) =>
    `${invoice.invoiceNo} ${invoice.customer} ${invoice.product}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function downloadInvoice(invoice: Invoice) {
    const content = `
SOUTH INDIAN TRADITIONAL DISHES
GST TAX INVOICE

Invoice Number: ${invoice.invoiceNo}
Date: ${invoice.date}

Customer: ${invoice.customer}

Product: ${invoice.product}
Quantity: ${invoice.quantity}
Unit Price: Rs. ${invoice.price.toFixed(2)}

Taxable Amount: Rs. ${invoice.taxableAmount.toFixed(2)}
GST Rate: ${invoice.gstRate}%

CGST: Rs. ${invoice.cgst.toFixed(2)}
SGST: Rs. ${invoice.sgst.toFixed(2)}
IGST: Rs. ${invoice.igst.toFixed(2)}

Grand Total: Rs. ${invoice.total.toFixed(2)}

Supply Type: ${invoice.invoiceType}
`;

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${invoice.invoiceNo}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );

  return (
    <div className="products-page">
      <div className="page-heading">
        <div>
          <h1>GST Invoice Management</h1>
          <p>Create and manage customer tax invoices.</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon">🧾</div>
          <div>
            <p>Total Invoices</p>
            <h2>{invoices.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">💰</div>
          <div>
            <p>Total Invoice Value</p>
            <h2>₹{totalRevenue.toFixed(2)}</h2>
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
          <h2>Create GST Invoice</h2>

          <form onSubmit={handleCreateInvoice}>
            <div className="form-grid">
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
                <label>Product Name</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit Price (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>GST Rate</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div className="form-group">
                <label>Supply Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) =>
                    setInvoiceType(
                      e.target.value as
                        | "Intra-state"
                        | "Inter-state"
                    )
                  }
                >
                  <option value="Intra-state">
                    Intra-state (CGST + SGST)
                  </option>
                  <option value="Inter-state">
                    Inter-state (IGST)
                  </option>
                </select>
              </div>
            </div>

            <div className="invoice-calculation">
              <h3>Invoice Calculation</h3>

              <p>Taxable Amount: ₹{taxableAmount.toFixed(2)}</p>
              <p>CGST: ₹{cgst.toFixed(2)}</p>
              <p>SGST: ₹{sgst.toFixed(2)}</p>
              <p>IGST: ₹{igst.toFixed(2)}</p>

              <h2>Grand Total: ₹{total.toFixed(2)}</h2>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || loading}
            >
              {saving ? "Generating..." : "Generate Invoice"}
            </button>
          </form>
        </div>
      )}

      <div className="product-form-card">
        <h2>Invoice History</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoice, customer or product..."
        />

        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>GST</th>
                <th>Total</th>
                <th>Supply Type</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8}>No invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNo}</td>
                    <td>{invoice.date}</td>
                    <td>{invoice.customer}</td>
                    <td>{invoice.product}</td>
                    <td>{invoice.gstRate}%</td>
                    <td>₹{invoice.total.toFixed(2)}</td>
                    <td>{invoice.invoiceType}</td>
                    <td>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => downloadInvoice(invoice)}
                      >
                        Download
                      </button>
                    </td>
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

export default GSTInvoices;
