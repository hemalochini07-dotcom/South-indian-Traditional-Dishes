
import { useEffect, useState } from "react";
import type { UserRole } from "./Login";
import { apiGet } from "./api";

type AuditLog = {
  id: number;
  user_email: string;
  user_role: UserRole;
  module: string;
  action: string;
  details: string;
  created_at: string;
};

type AuditProps = {
  email: string;
};

function Audit({ email }: AuditProps) {
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("All");

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch audit records using common API helper
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<AuditLog[]>("/audit-logs");

      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAuditLogs();
  }, []);

  // Search and module filtering
  const filteredLogs = logs.filter((log) => {
    const searchText =
      `${log.user_email} ${log.user_role} ${log.module} ${log.action} ${log.details}`
        .toLowerCase();

    const matchesSearch = searchText.includes(
      search.toLowerCase()
    );

    const matchesModule =
      filterModule === "All" ||
      log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  // Summary calculations
  const totalActivities = logs.length;

  const adminActivities = logs.filter(
    (log) => log.user_role === "Admin"
  ).length;

  const staffActivities = logs.filter(
    (log) => log.user_role === "Staff"
  ).length;

  // Format date and time
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="audit-page">
      <div className="audit-heading">
        <div>
          <h1>Audit Management</h1>
          <p>
            Monitor and review system activity records.
          </p>
        </div>

        <span className="audit-user">
          Logged in: {email}
        </span>
      </div>

      <div className="audit-summary">
        <div className="audit-summary-card">
          <span>Total Activities</span>
          <h2>{totalActivities}</h2>
        </div>

        <div className="audit-summary-card">
          <span>Admin Activities</span>
          <h2>{adminActivities}</h2>
        </div>

        <div className="audit-summary-card">
          <span>Staff Activities</span>
          <h2>{staffActivities}</h2>
        </div>
      </div>

      <div className="audit-filter-card">
        <input
          type="text"
          placeholder="Search user, module or activity..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={filterModule}
          onChange={(event) =>
            setFilterModule(event.target.value)
          }
        >
          <option value="All">All Modules</option>
          <option value="Authentication">Authentication</option>
          <option value="Products">Products</option>
          <option value="Sales Orders">Sales Orders</option>
          <option value="Inventory">Inventory</option>
          <option value="Production">Production</option>
          <option value="Customers">Customers</option>
          <option value="Suppliers">Suppliers</option>
          <option value="Purchases">Purchases</option>
          <option value="Finished Goods">Finished Goods</option>
          <option value="GST Invoices">GST Invoices</option>
          <option value="Payments">Payments</option>
          <option value="Costing">Costing</option>
        </select>

        <button
          className="secondary-button"
          onClick={() => void fetchAuditLogs()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="audit-table-card">
        <h3>Activity History</h3>

        {loading && (
          <p>Loading activity records...</p>
        )}

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.user_email}</td>
                      <td>{log.user_role}</td>
                      <td>{log.module}</td>
                      <td>
                        <span className="audit-action">
                          {log.action}
                        </span>
                      </td>
                      <td>{log.details}</td>
                      <td>{formatDate(log.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="audit-empty"
                    >
                      No activity records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Audit;
