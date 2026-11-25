
import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost, apiDelete } from "./api";

type UserRole = "Admin" | "Staff";

type Purchase = {
  id: number;
  supplier: string;
  material: string;
  quantity: number;
  unit: string;
  rate: number;
  date: string;
  total: number;
};

type BackendPurchase = {
  id: number;
  supplier: string;
  material: string;
  quantity: number | string;
  unit: string;
  price: number | string;
  date: string;
  total: number | string;
};

type PurchasesProps = {
  role: UserRole;
  onPurchaseSaved: (
    material: string,
    quantity: number,
    unit: string
  ) => boolean;
};

function Purchases({ role, onPurchaseSaved }: PurchasesProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [material, setMaterial] = useState("Rice Flour");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function mapPurchase(item: BackendPurchase): Purchase {
    return {
      id: item.id,
      supplier: item.supplier,
      material: item.material,
      quantity: Number(item.quantity),
      unit: item.unit,
      rate: Number(item.price),
      date: item.date,
      total: Number(item.total),
    };
  }

  async function loadPurchases() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendPurchase[]>("/purchases");
      setPurchases(data.map(mapPurchase));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load purchases."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchases();
  }, []);

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, item) => sum + item.total, 0);
  const totalQuantity = purchases.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const filteredPurchases = purchases.filter((item) =>
    `${item.supplier} ${item.material} ${item.date}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const qty = Number(quantity);
    const price = Number(rate);

    if (
      !supplier.trim() ||
      !quantity.trim() ||
      !rate.trim() ||
      !Number.isFinite(qty) ||
      !Number.isFinite(price) ||
      qty <= 0 ||
      price <= 0
    ) {
      alert("Please enter valid purchase details.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Backend saves the purchase and increases raw material stock.
      const savedPurchase = await apiPost<BackendPurchase>("/purchases", {
        supplier: supplier.trim(),
        material,
        quantity: qty,
        unit,
        price,
        date,
      });

      // Update App-level stock only after the backend succeeds.
      onPurchaseSaved(material, qty, unit);

      setPurchases((previous) => [
        mapPurchase(savedPurchase),
        ...previous,
      ]);

      setSupplier("");
      setQuantity("");
      setRate("");
      setShowForm(false);

      alert("Purchase saved and inventory stock updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save purchase."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePurchase(item: Purchase) {
    if (!window.confirm("Are you sure you want to delete this purchase?")) {
      return;
    }

    try {
      setError("");

      // Backend checks stock availability and reverses the stock update.
      await apiDelete(`/purchases/${item.id}`);

      setPurchases((previous) =>
        previous.filter((purchase) => purchase.id !== item.id)
      );

      // Keep App-level stock in sync with the backend reversal.
      onPurchaseSaved(item.material, -item.quantity, item.unit);

      alert("Purchase deleted and stock adjusted successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete purchase."
      );
    }
  }

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">PURCHASE MANAGEMENT</span>
        <h1>Raw Material Purchases</h1>
        <p>Record and manage raw material purchases from suppliers.</p>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Purchase Records</span>
          <h2>{totalPurchases}</h2>
        </div>

        <div className="product-summary-card">
          <span>Total Purchased Quantity</span>
          <h2>{totalQuantity} units</h2>
        </div>

        <div className="product-summary-card">
          <span>Total Purchase Amount</span>
          <h2>₹{totalAmount.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {role === "Admin" && (
        <div className="product-form-card">
          <div className="product-table-heading">
            <h2>Add Purchase</h2>
            <button
              className="add-product-button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Close Form" : "+ Add Purchase"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label>
                  Supplier Name
                  <input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Enter registered supplier name"
                    required
                  />
                </label>

                <label>
                  Raw Material
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  >
                    <option>Rice Flour</option>
                    <option>Besan Flour</option>
                    <option>Cooking Oil</option>
                    <option>Chilli Powder</option>
                    <option>Spices</option>
                    <option>Potatoes</option>
                    <option>Bananas</option>
                    <option>Sugar</option>
                    <option>Jaggery</option>
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </label>

                <label>
                  Unit
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option>kg</option>
                    <option>litre</option>
                    <option>pieces</option>
                    <option>packets</option>
                  </select>
                </label>

                <label>
                  Rate per Unit (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="Enter rate"
                    required
                  />
                </label>

                <label>
                  Purchase Date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
              </div>

              <p>
                <strong>Calculated Total: </strong>
                ₹{(
                  (Number(quantity) || 0) * (Number(rate) || 0)
                ).toLocaleString("en-IN")}
              </p>

              <div className="product-form-actions">
                <button
                  type="submit"
                  className="add-product-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Purchase"}
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Purchase History</h2>
          <input
            className="product-search"
            placeholder="Search purchases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total Amount</th>
                {role === "Admin" && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id.toString().slice(-5)}</td>
                    <td>{item.date}</td>
                    <td>{item.supplier}</td>
                    <td>{item.material}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>₹{item.rate.toFixed(2)}</td>
                    <td>₹{item.total.toLocaleString("en-IN")}</td>

                    {role === "Admin" && (
                      <td>
                        <button
                          className="delete-product-button"
                          onClick={() => deletePurchase(item)}
                        >
                          Delete
                        </button>
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

export default Purchases;
