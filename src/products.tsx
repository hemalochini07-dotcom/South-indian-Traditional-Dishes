
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";

type UserRole = "Admin" | "Staff";

type Product = {
  id: number;
  name: string;
  category: string;
  packetSize: string;
  price: number;
  status: "Active" | "Inactive";
};

type BackendProduct = {
  id: number;
  name: string;
  category: string;
  packet_size?: string;
  price: number | string;
  status?: "Active" | "Inactive";
};

type ProductsProps = {
  role: UserRole;
};

function Products({ role }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Murukku");
  const [packetSize, setPacketSize] = useState("250g");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Convert backend data into frontend format
  function mapProduct(item: BackendProduct): Product {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      packetSize: item.packet_size || "250g",
      price: Number(item.price),
      status: item.status || "Active",
    };
  }

  // Load products from PostgreSQL
  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendProduct[]>("/products");

      setProducts(data.map(mapProduct));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products from backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function resetForm() {
    setName("");
    setCategory("Murukku");
    setPacketSize("250g");
    setPrice("");
    setEditingId(null);
    setShowForm(false);
  }

  // Add or update product in PostgreSQL
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const enteredPrice = Number(price);

    if (!name.trim() || !price || enteredPrice <= 0) {
      alert("Please enter a product name and a valid price.");
      return;
    }

    const productData = {
      name: name.trim(),
      category,
      packet_size: packetSize,
      price: enteredPrice,
      status: "Active",
    };

    try {
      setSaving(true);
      setError("");

      if (editingId !== null) {
        await apiPut(
          `/products/${editingId}`,
          productData
        );
        alert("Product updated successfully!");
      } else {
        await apiPost("/products", productData);
        alert("Product added successfully!");
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save product.";

      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPacketSize(product.packetSize);
    setPrice(String(product.price));
    setShowForm(true);
  }

  // Delete product from PostgreSQL
  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setError("");

      await apiDelete(`/products/${id}`);

      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );

      alert("Product deleted successfully!");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to delete product.";

      setError(message);
      alert(message);
    }
  }

  const activeProducts = products.filter(
    (product) => product.status === "Active"
  ).length;

  const categoryCount = new Set(
    products.map((product) => product.category)
  ).size;

  return (
    <div className="products-page">
      <div className="products-heading">
        <div>
          <p className="page-eyebrow">INVENTORY MASTER</p>
          <h1>Product Management</h1>
          <p>Manage your traditional snack products and pricing.</p>
        </div>

        {role === "Admin" && (
          <button
            className="add-product-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Product
          </button>
        )}
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Products</span>
          <h2>{products.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Active Products</span>
          <h2>{activeProducts}</h2>
        </div>

        <div className="product-summary-card">
          <span>Categories</span>
          <h2>{categoryCount}</h2>
        </div>
      </div>

      {showForm && role === "Admin" && (
        <div className="product-form-card">
          <h2>
            {editingId !== null ? "Edit Product" : "Add New Product"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="product-form-grid">
              <label>
                Product Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>Murukku</option>
                  <option>Mixture</option>
                  <option>Chips</option>
                  <option>Sweets</option>
                </select>
              </label>

              <label>
                Packet Size
                <select
                  value={packetSize}
                  onChange={(event) => setPacketSize(event.target.value)}
                >
                  <option>100g</option>
                  <option>250g</option>
                  <option>500g</option>
                  <option>1kg</option>
                </select>
              </label>

              <label>
                Selling Price (₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Enter price"
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
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Product"
                    : "Save Product"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginBottom: "15px" }}>
          {error}
        </div>
      )}

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Product List</h2>

          <input
            className="product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
          />
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Packet Size</th>
                <th>Price</th>
                <th>Status</th>
                {role === "Admin" && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 7 : 6}>
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      PRD-{product.id.toString().slice(-5)}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.packetSize}</td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td>
                      <span className="product-status">
                        {product.status}
                      </span>
                    </td>

                    {role === "Admin" && (
                      <td>
                        <div className="product-actions">
                          <button onClick={() => handleEdit(product)}>
                            Edit
                          </button>

                          <button
                            className="delete-product-button"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={role === "Admin" ? 7 : 6}
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;
