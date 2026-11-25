
import { useEffect, useState, type FormEvent } from "react";
import type { FinishedProduct } from "./FinishedGoods";
import { apiGet, apiPost } from "./api";

type UserRole = "Admin" | "Staff";

type RecipeItem = {
  material: string;
  quantity: number;
  unit: string;
};

type ProductionBatch = {
  id: number;
  batchNo: string;
  product: string;
  quantity: number;
  date: string;
  status: string;
};

type StockItem = {
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

type BackendFinishedProduct = {
  id: number;
  name: string;
  category: string;
  quantity: number | string;
  unit: string;
  minimum_stock: number | string;
};

type BackendBatch = {
  id: number;
  batch_no: string;
  product: string;
  quantity: number | string;
  date: string;
  status: string;
};

type ProductionProps = {
  role: UserRole;
  stock: StockItem[];
  onStockUpdate: (updatedStock: StockItem[]) => void;
  finishedProducts: FinishedProduct[];
  onFinishedGoodsUpdate: (products: FinishedProduct[]) => void;
};

const initialRecipes: Record<string, RecipeItem[]> = {
  Murukku: [
    { material: "Rice Flour", quantity: 2, unit: "kg" },
    { material: "Cooking Oil", quantity: 1, unit: "litre" },
    { material: "Spices", quantity: 0.2, unit: "kg" },
  ],
  Mixture: [
    { material: "Besan Flour", quantity: 2, unit: "kg" },
    { material: "Cooking Oil", quantity: 1, unit: "litre" },
    { material: "Chilli Powder", quantity: 0.1, unit: "kg" },
  ],
  Chips: [
    { material: "Potatoes", quantity: 3, unit: "kg" },
    { material: "Cooking Oil", quantity: 1, unit: "litre" },
    { material: "Spices", quantity: 0.1, unit: "kg" },
  ],
  Sweets: [
    { material: "Besan Flour", quantity: 1, unit: "kg" },
    { material: "Sugar", quantity: 1, unit: "kg" },
    { material: "Ghee", quantity: 0.5, unit: "kg" },
  ],
};

const productNames: Record<string, string> = {
  Murukku: "Traditional Murukku",
  Mixture: "South Indian Mixture",
  Chips: "Banana Chips",
  Sweets: "Mysore Pak",
};

function Production({
  role,
  stock,
  onStockUpdate,
  finishedProducts,
  onFinishedGoodsUpdate,
}: ProductionProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [product, setProduct] = useState("Murukku");
  const [quantity, setQuantity] = useState("10");
  const [batches, setBatches] = useState<ProductionBatch[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function mapBatch(item: BackendBatch): ProductionBatch {
    return {
      id: item.id,
      batchNo: item.batch_no,
      product: item.product,
      quantity: Number(item.quantity),
      date: item.date,
      status: item.status,
    };
  }

  function mapStock(item: BackendStockItem): StockItem {
    return {
      id: item.id,
      material: item.material,
      quantity: Number(item.quantity),
      unit: item.unit,
      minimumStock: Number(item.minimum_stock),
    };
  }

  function mapFinishedProduct(
    item: BackendFinishedProduct
  ): FinishedProduct {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit,
      minimumStock: Number(item.minimum_stock),
    };
  }

  async function loadBatches() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendBatch[]>("/production");
      setBatches(data.map(mapBatch));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load production history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  const materialsNeeded = recipes[product].map((item) => ({
    ...item,
    required: item.quantity * Number(quantity),
  }));

  async function refreshInventories() {
    const [stockData, finishedData] = await Promise.all([
      apiGet<BackendStockItem[]>("/raw-materials"),
      apiGet<BackendFinishedProduct[]>("/finished-goods"),
    ]);

    onStockUpdate(stockData.map(mapStock));
    onFinishedGoodsUpdate(finishedData.map(mapFinishedProduct));
  }

  async function handleProduction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid production quantity.");
      return;
    }

    if (!Number.isInteger(amount)) {
      alert("Production quantity must be a whole number.");
      return;
    }

    const finishedProduct = finishedProducts.find(
      (item) => item.category === product
    );

    if (!finishedProduct) {
      alert("This product is missing from Finished Goods Inventory.");
      return;
    }

    // Check required raw materials before sending the request.
    for (const item of materialsNeeded) {
      const available = stock.find(
        (s) =>
          s.material === item.material &&
          s.unit === item.unit
      );

      if (!available || available.quantity < item.required) {
        alert(
          `Insufficient ${item.material}. Required: ${item.required} ${item.unit}.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      const batchNo = `BATCH-${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);

      // Backend transaction deducts raw materials and increases finished goods.
      const savedBatch = await apiPost<BackendBatch>("/production", {
        batch_no: batchNo,
        product: productNames[product],
        quantity: amount,
        date: today,
        status: "Completed",
        recipe: recipes[product],
      });

      setBatches((previous) => [
        mapBatch(savedBatch),
        ...previous,
      ]);

      // Reload both inventories from the database.
      try {
        await refreshInventories();
      } catch {
        setError(
          "Production was saved, but inventory refresh failed. Reopen this page to reload the latest stock."
        );
      }

      alert(
        `Production completed!\n${amount} units of ${productNames[product]} added to Finished Goods.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete production."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateRecipe(index: number, value: string) {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) return;

    setRecipes((previous) => ({
      ...previous,
      [product]: previous[product].map((item, i) =>
        i === index
          ? { ...item, quantity: amount }
          : item
      ),
    }));
  }

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">MANUFACTURING</span>
        <h1>Production Management</h1>
        <p>
          Manage recipes, production batches and raw material consumption.
        </p>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Batches</span>
          <h2>{batches.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Products</span>
          <h2>4</h2>
        </div>

        <div className="product-summary-card">
          <span>Completed Batches</span>
          <h2>
            {batches.filter((batch) => batch.status === "Completed").length}
          </h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="product-form-card">
        <h2>Bill of Materials (BOM)</h2>
        <p>Select a product to view its recipe per production unit.</p>

        <div className="product-form-grid">
          <label>
            Select Product
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              {Object.keys(recipes).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Raw Material</th>
                <th>Quantity per Unit</th>
                <th>Unit</th>
                <th>Available Stock</th>
              </tr>
            </thead>

            <tbody>
              {recipes[product].map((item, index) => {
                const available = stock.find(
                  (s) => s.material === item.material
                );

                return (
                  <tr key={`${item.material}-${index}`}>
                    <td>{item.material}</td>
                    <td>
                      {role === "Admin" ? (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateRecipe(index, e.target.value)
                          }
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td>{item.unit}</td>
                    <td>
                      {available
                        ? `${available.quantity} ${available.unit}`
                        : "Not available"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="product-form-card">
        <h2>Create Production Batch</h2>

        <form onSubmit={handleProduction}>
          <div className="product-form-grid">
            <label>
              Product
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                {Object.keys(recipes).map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>

            <label>
              Production Quantity (units)
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </label>
          </div>

          <h3>Required Raw Materials</h3>

          <div className="product-table-scroll">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Required Quantity</th>
                </tr>
              </thead>

              <tbody>
                {materialsNeeded.map((item, index) => (
                  <tr key={`${item.material}-${index}`}>
                    <td>{item.material}</td>
                    <td>
                      {item.required.toFixed(2)} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {role === "Admin" && (
            <div className="product-form-actions">
              <button
                className="add-product-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Processing..." : "Complete Production"}
              </button>
            </div>
          )}

          {role === "Staff" && (
            <p>
              Staff can view production details. Admin permission is
              required to complete a batch.
            </p>
          )}
        </form>
      </div>

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Production History</h2>
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading production history...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    No production batches recorded yet.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>{batch.batchNo}</td>
                    <td>{batch.product}</td>
                    <td>{batch.quantity}</td>
                    <td>{batch.date}</td>
                    <td>
                      <span className="product-status">
                        {batch.status}
                      </span>
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

export default Production;
