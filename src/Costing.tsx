
import { useEffect, useState, type FormEvent } from "react";
import type { UserRole } from "./Login";
import { apiGet, apiPost } from "./api";

type CostRecord = {
  id: number;
  product: string;
  batchQuantity: number;
  materialCost: number;
  labourCost: number;
  packagingCost: number;
  otherCost: number;
  sellingPrice: number;
  totalCost: number;
  costPerPacket: number;
  profitPerPacket: number;
  date: string;
};

type BackendCostRecord = {
  id: number;
  product: string;
  batch_quantity: number | string;
  material_cost: number | string;
  labour_cost: number | string;
  packaging_cost: number | string;
  other_cost: number | string;
  selling_price: number | string;
  total_cost: number | string;
  cost_per_packet: number | string;
  profit_per_packet: number | string;
  date: string;
};

type CostingProps = {
  role: UserRole;
};

function mapCostRecord(item: BackendCostRecord): CostRecord {
  return {
    id: item.id,
    product: item.product,
    batchQuantity: Number(item.batch_quantity),
    materialCost: Number(item.material_cost),
    labourCost: Number(item.labour_cost),
    packagingCost: Number(item.packaging_cost),
    otherCost: Number(item.other_cost),
    sellingPrice: Number(item.selling_price),
    totalCost: Number(item.total_cost),
    costPerPacket: Number(item.cost_per_packet),
    profitPerPacket: Number(item.profit_per_packet),
    date: item.date,
  };
}

function Costing({ role }: CostingProps) {
  const [product, setProduct] = useState("Traditional Murukku");
  const [batchQuantity, setBatchQuantity] = useState("100");
  const [materialCost, setMaterialCost] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const [records, setRecords] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadRecords() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet<BackendCostRecord[]>("/costing");

      setRecords(data.map(mapCostRecord));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load cost records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const quantity = Number(batchQuantity);
  const material = Number(materialCost) || 0;
  const labour = Number(labourCost) || 0;
  const packaging = Number(packagingCost) || 0;
  const other = Number(otherCost) || 0;
  const price = Number(sellingPrice) || 0;

  const totalCost = material + labour + packaging + other;

  const costPerPacket =
    quantity > 0 ? totalCost / quantity : 0;

  const profitPerPacket = price - costPerPacket;
  const totalProfit = profitPerPacket * quantity;

  async function handleSaveCost(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 10000000
    ) {
      alert("Enter a valid batch quantity.");
      return;
    }

    const values = [
      materialCost,
      labourCost,
      packagingCost,
      otherCost,
      sellingPrice,
    ];

    if (
      values.some(
        (value) =>
          value.trim() === "" ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
      )
    ) {
      alert("Enter valid non-negative cost and selling price values.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const savedRecord = await apiPost<BackendCostRecord>(
        "/costing",
        {
          product,
          batch_quantity: quantity,
          material_cost: material,
          labour_cost: labour,
          packaging_cost: packaging,
          other_cost: other,
          selling_price: price,
          date: new Date().toISOString().slice(0, 10),
        }
      );

      setRecords((previous) => [
        mapCostRecord(savedRecord),
        ...previous,
      ]);

      alert("Product cost saved successfully!");

      setMaterialCost("");
      setLabourCost("");
      setPackagingCost("");
      setOtherCost("");
      setSellingPrice("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save cost record."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalRecordedCost = records.reduce(
    (sum, record) => sum + record.totalCost,
    0
  );

  const averageProfit = records.length
    ? records.reduce(
        (sum, record) => sum + record.profitPerPacket,
        0
      ) / records.length
    : 0;

  return (
    <div className="products-page">
      <div className="page-heading">
        <div>
          <h1>Costing Management</h1>
          <p>
            Calculate manufacturing cost and profit for your products.
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon">💰</div>
          <div>
            <p>Total Recorded Cost</p>
            <h2>₹{totalRecordedCost.toFixed(2)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">📦</div>
          <div>
            <p>Cost Records</p>
            <h2>{records.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">📈</div>
          <div>
            <p>Average Profit / Packet</p>
            <h2>₹{averageProfit.toFixed(2)}</h2>
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
          <h2>Calculate Product Manufacturing Cost</h2>

          <form onSubmit={handleSaveCost}>
            <div className="form-grid">
              <div className="form-group">
                <label>Product</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                >
                  <option value="Traditional Murukku">
                    Traditional Murukku
                  </option>
                  <option value="South Indian Mixture">
                    South Indian Mixture
                  </option>
                  <option value="Banana Chips">Banana Chips</option>
                  <option value="Mysore Pak">Mysore Pak</option>
                </select>
              </div>

              <div className="form-group">
                <label>Batch Quantity (Packets)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Raw Material Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={materialCost}
                  onChange={(e) => setMaterialCost(e.target.value)}
                  placeholder="Enter material cost"
                  required
                />
              </div>

              <div className="form-group">
                <label>Labour Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={labourCost}
                  onChange={(e) => setLabourCost(e.target.value)}
                  placeholder="Enter labour cost"
                  required
                />
              </div>

              <div className="form-group">
                <label>Packaging Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  placeholder="Enter packaging cost"
                  required
                />
              </div>

              <div className="form-group">
                <label>Other Expenses (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  placeholder="Enter other expenses"
                  required
                />
              </div>

              <div className="form-group">
                <label>Selling Price Per Packet (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="Enter selling price"
                  required
                />
              </div>
            </div>

            <div className="invoice-calculation">
              <h3>Cost Calculation Preview</h3>

              <p>
                Total Manufacturing Cost:
                <strong> ₹{totalCost.toFixed(2)}</strong>
              </p>

              <p>
                Cost Per Packet:
                <strong> ₹{costPerPacket.toFixed(2)}</strong>
              </p>

              <p>
                Profit Per Packet:
                <strong
                  className={
                    profitPerPacket >= 0
                      ? "profit-positive"
                      : "profit-negative"
                  }
                >
                  {" "}₹{profitPerPacket.toFixed(2)}
                </strong>
              </p>

              <p>
                Estimated Batch Profit:
                <strong
                  className={
                    totalProfit >= 0
                      ? "profit-positive"
                      : "profit-negative"
                  }
                >
                  {" "}₹{totalProfit.toFixed(2)}
                </strong>
              </p>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Cost Record"}
            </button>
          </form>
        </div>
      )}

      <div className="product-form-card">
        <h2>Product Cost History</h2>

        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch Quantity</th>
                <th>Total Cost</th>
                <th>Cost / Packet</th>
                <th>Selling Price</th>
                <th>Profit / Packet</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>Loading cost records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7}>No cost records available.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.product}</td>
                    <td>{record.batchQuantity}</td>
                    <td>₹{record.totalCost.toFixed(2)}</td>
                    <td>₹{record.costPerPacket.toFixed(2)}</td>
                    <td>₹{record.sellingPrice.toFixed(2)}</td>
                    <td
                      className={
                        record.profitPerPacket >= 0
                          ? "profit-positive"
                          : "profit-negative"
                      }
                    >
                      ₹{record.profitPerPacket.toFixed(2)}
                    </td>
                    <td>{record.date}</td>
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

export default Costing;
