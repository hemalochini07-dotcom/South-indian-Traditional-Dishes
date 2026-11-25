
import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";

type UserRole = "Admin" | "Staff";

type Supplier = {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  material: string;
  address: string;
};

type BackendSupplier = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type SuppliersProps = {
  role: UserRole;
};

function Suppliers({ role }: SuppliersProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [material, setMaterial] = useState("Rice Flour");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function mapSupplier(supplier: BackendSupplier): Supplier {
    return {
      id: supplier.id,
      name: supplier.name,
      contactPerson: "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      material: "Other",
      address: supplier.address || "",
    };
  }

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendSupplier[]>("/suppliers");
      setSuppliers(data.map(mapSupplier));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) =>
    `${supplier.name} ${supplier.contactPerson} ${supplier.material} ${supplier.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function resetForm() {
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setMaterial("Rice Flour");
    setAddress("");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !contactPerson.trim() || !/^\d{10}$/.test(phone)) {
      alert(
        "Enter supplier name, contact person and a valid 10-digit phone number."
      );
      return;
    }

    const supplierData = {
      name: name.trim(),
      phone,
      email: email.trim(),
      address: address.trim(),
    };

    try {
      setSaving(true);
      setError("");

      if (editingId !== null) {
        await apiPut(`/suppliers/${editingId}`, supplierData);
      } else {
        await apiPost("/suppliers", supplierData);
      }

      await loadSuppliers();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save supplier."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setName(supplier.name);
    setContactPerson(supplier.contactPerson);
    setPhone(supplier.phone);
    setEmail(supplier.email);
    setMaterial(supplier.material);
    setAddress(supplier.address);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      setError("");
      await apiDelete(`/suppliers/${id}`);
      await loadSuppliers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete supplier."
      );
    }
  }

  return (
    <section className="products-page">
      <div className="products-heading">
        <div>
          <p className="page-eyebrow">SUPPLIER MASTER</p>
          <h1>Supplier Management</h1>
          <p>Manage suppliers and raw material information.</p>
        </div>

        {role === "Admin" && (
          <button
            className="add-product-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Supplier
          </button>
        )}
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Suppliers</span>
          <h2>{suppliers.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Raw Material Types</span>
          <h2>{new Set(suppliers.map((supplier) => supplier.material)).size}</h2>
        </div>

        <div className="product-summary-card">
          <span>Contactable Suppliers</span>
          <h2>{suppliers.filter((supplier) => supplier.phone).length}</h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {showForm && role === "Admin" && (
        <div className="product-form-card">
          <h2>{editingId !== null ? "Edit Supplier" : "Add New Supplier"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="product-form-grid">
              <label>
                Supplier / Company Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </label>

              <label>
                Contact Person
                <input
                  value={contactPerson}
                  onChange={(event) => setContactPerson(event.target.value)}
                  placeholder="Enter contact person"
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit phone number"
                  maxLength={10}
                  required
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="supplier@example.com"
                />
              </label>

              <label>
                Raw Material Supplied
                <select
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
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
                  <option>Other</option>
                </select>
              </label>

              <label>
                Address
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Enter supplier address"
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
                    ? "Update Supplier"
                    : "Save Supplier"}
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

      <div className="product-table-card">
        <div className="product-table-heading">
          <h2>Supplier List</h2>

          <input
            className="product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers..."
          />
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Material</th>
                <th>Email</th>
                <th>Address</th>
                {role === "Admin" && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 8 : 7}>
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>SUP-{supplier.id.toString().slice(-5)}</td>
                    <td>{supplier.name}</td>
                    <td>{supplier.contactPerson || "—"}</td>
                    <td>{supplier.phone}</td>
                    <td>{supplier.material}</td>
                    <td>{supplier.email || "—"}</td>
                    <td>{supplier.address || "—"}</td>

                    {role === "Admin" && (
                      <td>
                        <div className="product-actions">
                          <button onClick={() => handleEdit(supplier)}>
                            Edit
                          </button>

                          <button
                            className="delete-product-button"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Suppliers;
