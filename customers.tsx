
import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";

type UserRole = "Admin" | "Staff";

type Customer = {
  id: number;
  name: string;
  type: "Retailer" | "Wholesaler";
  phone: string;
  email: string;
  address: string;
};

type BackendCustomer = {
  id: number;
  name: string;
  type: "Retailer" | "Wholesaler";
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type CustomersProps = {
  role: UserRole;
};

function Customers({ role }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"Retailer" | "Wholesaler">("Retailer");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function mapCustomer(customer: BackendCustomer): Customer {
    return {
      id: customer.id,
      name: customer.name,
      type: customer.type || "Retailer",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    };
  }

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendCustomer[]>("/customers");
      setCustomers(data.map(mapCustomer));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function resetForm() {
    setName("");
    setType("Retailer");
    setPhone("");
    setEmail("");
    setAddress("");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !/^\d{10}$/.test(phone)) {
      alert("Enter a customer name and a valid 10-digit phone number.");
      return;
    }

    const customerData = {
      name: name.trim(),
      type,
      phone,
      email: email.trim(),
      address: address.trim(),
    };

    try {
      setSaving(true);
      setError("");

      if (editingId !== null) {
        await apiPut(`/customers/${editingId}`, customerData);
      } else {
        await apiPost("/customers", customerData);
      }

      await loadCustomers();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(customer: Customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setType(customer.type);
    setPhone(customer.phone);
    setEmail(customer.email);
    setAddress(customer.address);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      setError("");
      await apiDelete(`/customers/${id}`);
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete customer."
      );
    }
  }

  return (
    <section className="products-page">
      <div className="products-heading">
        <div>
          <p className="page-eyebrow">CUSTOMER MASTER</p>
          <h1>Customer Management</h1>
          <p>Manage your retailers and wholesale customers.</p>
        </div>

        {role === "Admin" && (
          <button
            className="add-product-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Customer
          </button>
        )}
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Customers</span>
          <h2>{customers.length}</h2>
        </div>

        <div className="product-summary-card">
          <span>Retailers</span>
          <h2>
            {customers.filter((customer) => customer.type === "Retailer").length}
          </h2>
        </div>

        <div className="product-summary-card">
          <span>Wholesalers</span>
          <h2>
            {customers.filter((customer) => customer.type === "Wholesaler").length}
          </h2>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {showForm && role === "Admin" && (
        <div className="product-form-card">
          <h2>{editingId !== null ? "Edit Customer" : "Add New Customer"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="product-form-grid">
              <label>
                Customer Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </label>

              <label>
                Customer Type
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as "Retailer" | "Wholesaler")
                  }
                >
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                </select>
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
                  placeholder="customer@example.com"
                />
              </label>

              <label className="customer-address-field">
                Address
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Enter customer address"
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
                    ? "Update Customer"
                    : "Save Customer"}
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
          <h2>Customer List</h2>

          <input
            className="product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers..."
          />
        </div>

        <div className="product-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                {role === "Admin" && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 7 : 6}>
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 7 : 6}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>CUS-{customer.id.toString().slice(-5)}</td>
                    <td>{customer.name}</td>
                    <td>{customer.type}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || "—"}</td>
                    <td>{customer.address || "—"}</td>

                    {role === "Admin" && (
                      <td>
                        <div className="product-actions">
                          <button onClick={() => handleEdit(customer)}>
                            Edit
                          </button>

                          <button
                            className="delete-product-button"
                            onClick={() => handleDelete(customer.id)}
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

export default Customers;
