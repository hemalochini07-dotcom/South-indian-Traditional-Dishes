
import { useEffect, useState } from "react";
import { apiGet, apiPut } from "./api";

type UserRole = "Admin" | "Staff";

export type FinishedProduct = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumStock: number;
};

type BackendFinishedProduct = {
  id: number;
  name: string;
  category: string;
  quantity: number | string;
  unit: string;
  minimum_stock: number | string;
};

type FinishedGoodsProps = {
  role: UserRole;
  products: FinishedProduct[];
  onProductsUpdate: (products: FinishedProduct[]) => void;
};

function FinishedGoods({
  role,
  products,
  onProductsUpdate,
}: FinishedGoodsProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function mapProduct(item: BackendFinishedProduct): FinishedProduct {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit,
      minimumStock: Number(item.minimum_stock),
    };
  }

  // Load finished goods from PostgreSQL
  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendFinishedProduct[]>(
        "/finished-goods"
      );

      onProductsUpdate(data.map(mapProduct));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load finished goods."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(
    (product) => product.quantity <= product.minimumStock
  ).length;

  async function updateProduct(product: FinishedProduct) {
    const value = window.prompt(
      `Enter new stock quantity for ${product.name}:`,
      String(product.quantity)
    );

    if (value === null) return;

    const quantity = Number(value);

    if (
      value.trim() === "" ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      alert("Enter a valid stock quantity.");
      return;
    }

    const minimumValue = window.prompt(
      `Enter minimum stock level for ${product.name}:`,
      String(product.minimumStock)
    );

    if (minimumValue === null) return;

    const minimumStock = Number(minimumValue);

    if (
      minimumValue.trim() === "" ||
      !Number.isFinite(minimumStock) ||
      minimumStock < 0
    ) {
      alert("Enter a valid minimum stock quantity.");
      return;
    }

    try {
      setSavingId(product.id);
      setError("");

      const updated = await apiPut<BackendFinishedProduct>(
        `/finished-goods/${product.id}`,
        {
          quantity,
          minimum_stock: minimumStock,
        }
      );

      const updatedProduct = mapProduct(updated);

      onProductsUpdate(
        products.map((item) =>
          item.id === product.id ? updatedProduct : item
        )
      );

      alert("Finished goods stock updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update finished goods."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="products-page">
      <div className="products-heading">
        <span className="page-eyebrow">STOCK MANAGEMENT</span>
        <h1>Finished Goods Inventory</h1>
        <p>Monitor manufactured and packaged snack products.</p>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Products</span>
          <h2>{products.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Total Stock</span>
          <h2>
            {products.reduce(
              (total, product) => total + product.quantity,
              0
            )}
          </h2>
        </div>

        <div className="product-summary-card">
          <span>Low Stock Products</span>
          <h2>{lowStockCount}</h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Finished Products</h2>

          <input
            className="product-search"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Available Stock</th>
                <th>Minimum Stock</th>
                <th>Status</th>
                {role === "Admin" && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 6 : 5}>
                    Loading finished goods...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 6 : 5}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow =
                    product.quantity <= product.minimumStock;

                  return (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>
                        {product.quantity} {product.unit}
                      </td>
                      <td>
                        {product.minimumStock} {product.unit}
                      </td>
                      <td>
                        <span
                          className="product-status"
                          style={
                            isLow
                              ? {
                                  background: "#fde8e8",
                                  color: "#b42318",
                                }
                              : undefined
                          }
                        >
                          {isLow ? "Low Stock" : "Available"}
                        </span>
                      </td>

                      {role === "Admin" && (
                        <td>
                          <button
                            className="add-product-button"
                            type="button"
                            disabled={savingId === product.id}
                            onClick={() => updateProduct(product)}
                          >
                            {savingId === product.id
                              ? "Saving..."
                              : "Update"}
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

export default FinishedGoods;
