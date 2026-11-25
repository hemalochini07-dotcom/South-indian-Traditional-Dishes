
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional
from datetime import date


# =====================================
# 1. PRODUCT SCHEMAS
# =====================================

class ProductCreate(BaseModel):
    name: str
    category: str
    packet_size: str = "250g"
    price: Decimal = Decimal("0.00")
    status: str = "Active"
    description: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    packet_size: Optional[str] = None
    price: Optional[Decimal] = None
    status: Optional[str] = None
    description: Optional[str] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    packet_size: str
    price: Decimal
    status: str
    description: Optional[str] = None


# =====================================
# 2. CUSTOMER SCHEMAS
# =====================================

class CustomerCreate(BaseModel):
    name: str
    type: str = "Retailer"
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


# =====================================
# 3. SUPPLIER SCHEMAS
# =====================================

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


# =====================================
# 4. RAW MATERIAL SCHEMAS
# =====================================

class RawMaterialCreate(BaseModel):
    material: str
    quantity: Decimal = Decimal("0")
    unit: str
    minimum_stock: Decimal = Decimal("0")


class RawMaterialUpdate(BaseModel):
    material: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    minimum_stock: Optional[Decimal] = None


class RawMaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    material: str
    quantity: Decimal
    unit: str
    minimum_stock: Decimal


# =====================================
# 5. PURCHASE SCHEMAS
# =====================================

class PurchaseCreate(BaseModel):
    supplier: str
    material: str
    quantity: Decimal
    unit: str
    price: Decimal
    date: date


class PurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supplier: str
    material: str
    quantity: Decimal
    unit: str
    price: Decimal
    total: Decimal
    date: date


# =====================================
# 6. FINISHED GOODS SCHEMAS
# =====================================

class FinishedProductCreate(BaseModel):
    name: str
    category: str
    quantity: int = 0
    unit: str = "packets"
    minimum_stock: int = 0


class FinishedProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    minimum_stock: Optional[int] = None


class FinishedProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    quantity: int
    unit: str
    minimum_stock: int


# =====================================
# 7. PRODUCTION SCHEMAS
# =====================================

class ProductionBatchCreate(BaseModel):
    batch_no: str
    product: str
    quantity: int
    date: date
    recipe: list[dict]


class ProductionBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_no: str
    product: str
    quantity: int
    date: date
    status: str
    recipe: list[dict]


# =====================================
# 8. SALES ORDER SCHEMAS
# =====================================

class SalesOrderCreate(BaseModel):
    order_no: str
    customer: str
    product: str
    quantity: int
    price: Decimal
    date: date
    district: Optional[str] = None


class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None
    district: Optional[str] = None


class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    customer: str
    product: str
    quantity: int
    price: Decimal
    total: Decimal
    date: date
    status: str
    district: Optional[str] = None


# =====================================
# 9. GST INVOICE SCHEMAS
# =====================================

class GSTInvoiceCreate(BaseModel):
    invoice_no: str
    customer: str
    product: str
    quantity: int
    price: Decimal
    gst_rate: Decimal
    invoice_type: str
    date: date


class GSTInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_no: str
    customer: str
    product: str
    quantity: int
    price: Decimal
    taxable_amount: Decimal
    gst_rate: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    total: Decimal
    invoice_type: str
    date: date


# =====================================
# 10. PAYMENT SCHEMAS
# =====================================

class PaymentCreate(BaseModel):
    payment_no: str
    invoice_no: str
    customer: str
    amount: Decimal
    method: str
    date: date


class PaymentUpdate(BaseModel):
    status: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_no: str
    invoice_no: str
    customer: str
    amount: Decimal
    method: str
    date: date
    status: str


# =====================================
# 11. COSTING SCHEMAS
# =====================================

class CostRecordCreate(BaseModel):
    product: str
    batch_quantity: int
    material_cost: Decimal
    labour_cost: Decimal
    packaging_cost: Decimal
    other_cost: Decimal
    selling_price: Decimal
    date: date


class CostRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product: str
    batch_quantity: int
    material_cost: Decimal
    labour_cost: Decimal
    packaging_cost: Decimal
    other_cost: Decimal
    selling_price: Decimal
    total_cost: Decimal
    cost_per_packet: Decimal
    profit_per_packet: Decimal
    date: date
