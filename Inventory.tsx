
import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPut } from "./api";

export type StockItem = {
  id: number;
  material: string;
  quantity: number;
  unit: string;
  minimumStock: number;
};

type BackendStockItem = {
  id: number;
  material: string;
  quantity: number | string;
  unit: string;
  minimum_stock: number | string;
};

type UserRole = "Admin" | "Staff";

type InventoryProps = {
  role: UserRole;
  stock: StockItem[];
  onStockUpdate: (updatedStock: StockItem[]) => void;
};

function Inventory({
  role,
  stock,
  onStockUpdate,
}: InventoryProps) {
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [newMinimum, setNewMinimum] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Convert backend data into frontend format
  function mapStock(item: BackendStockItem): StockItem {
    return {
      id: item.id,
      material: item.material,
      quantity: Number(item.quantity),
      unit: item.unit,
      minimumStock: Number(item.minimum_stock),
    };
  }

  // Load inventory from PostgreSQL
  async function loadStock() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendStockItem[]>("/raw-materials");

      onStockUpdate(data.map(mapStock));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load inventory."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  const lowStockCount = stock.filter(
    (item) => item.quantity <= item.minimumStock
  ).length;

  const filteredStock = stock.filter((item) =>
    item.material.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(item: StockItem) {
    setEditingItem(item);
    setNewQuantity(String(item.quantity));
    setNewMinimum(String(item.minimumStock));
  }

  async function saveStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(newQuantity);
    const minimum = Number(newMinimum);

    if (
      !editingItem ||
      newQuantity.trim() === "" ||
      newMinimum.trim() === "" ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(minimum) ||
      quantity < 0 ||
      minimum < 0
    ) {
      alert("Please enter valid stock quantities.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiPut(`/raw-materials/${editingItem.id}`, {
        quantity,
        minimum_stock: minimum,
      });

      const updatedStock = stock.map((item) =>
        item.id === editingItem.id
          ? { ...item, quantity, minimumStock: minimum }
          : item
      );

      onStockUpdate(updatedStock);
      setEditingItem(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">INVENTORY MANAGEMENT</span>
        <h1>Raw Material Inventory</h1>
        <p>Monitor available raw materials and stock levels.</p>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Raw Materials</span>
          <h2>{stock.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Low Stock Materials</span>
          <h2>{lowStockCount}</h2>
        </div>

        <div className="product-summary-card">
          <span>Stock Status</span>
          <h2>{lowStockCount === 0 ? "Healthy" : "Attention"}</h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {editingItem && role === "Admin" && (
        <div className="product-form-card">
          <h2>Update Stock – {editingItem.material}</h2>

          <form onSubmit={saveStock}>
            <div className="product-form-grid">
              <label>
                Available Quantity ({editingItem.unit})
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  required
                />
              </label>

              <label>
                Minimum Stock Level ({editingItem.unit})
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMinimum}
                  onChange={(e) => setNewMinimum(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="product-form-actions">
              <button
                type="submit"
                className="add-product-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => setEditingItem(null)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Available Stock</h2>

          <input
            className="product-search"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Raw Material</th>
                <th>Available Quantity</th>
                <th>Minimum Stock</th>
                <th>Stock Status</th>
                {role === "Admin" && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 6 : 5}>
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 6 : 5}>
                    No materials found.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isLow = item.quantity <= item.minimumStock;

                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.material}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.minimumStock} {item.unit}</td>
                      <td>
                        <span
                          className="product-status"
                          style={{
                            background: isLow ? "#fde8e8" : "#e6f4e9",
                            color: isLow ? "#b42318" : "#246b36",
                          }}
                        >
                          {isLow ? "Low Stock" : "Available"}
                        </span>
                      </td>

                      {role === "Admin" && (
                        <td>
                          <button
                            className="add-product-button"
                            onClick={() => startEdit(item)}
                          >
                            Edit Stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
