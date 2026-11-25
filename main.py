
from decimal import Decimal

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import engine, Base, get_db, SessionLocal

from models import (
    AuditLog,
    Product,
    Customer,
    Supplier,
    RawMaterial,
    Purchase,
    FinishedProduct,
    ProductionBatch,
    SalesOrder,
    GSTInvoice,
    Payment,
    CostRecord
)

from schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse,
    SupplierCreate, SupplierUpdate, SupplierResponse,
    RawMaterialCreate, RawMaterialUpdate, RawMaterialResponse,
    PurchaseCreate, PurchaseResponse,
    FinishedProductCreate, FinishedProductUpdate,
    FinishedProductResponse,
    ProductionBatchCreate, ProductionBatchResponse,
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse,
    GSTInvoiceCreate, GSTInvoiceResponse,
    PaymentCreate, PaymentUpdate, PaymentResponse,
    CostRecordCreate, CostRecordResponse
)


# =====================================
# DATABASE TABLE CREATION
# =====================================

Base.metadata.create_all(bind=engine)


# =====================================
# FASTAPI APPLICATION
# =====================================

app = FastAPI(
    title="South Indian Traditional Dishes API",
    description="Manufacturing Management System Backend",
    version="1.0.0"
)


# =====================================
# CORS CONFIGURATION
# =====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =====================================
# AUDIT LOG SCHEMA
# =====================================

class AuditLogCreate(BaseModel):
    user_email: str
    user_role: str
    action: str
    module: str
    details: str = ""


# =====================================
# AUTOMATIC AUDIT LOGGING
# =====================================

@app.middleware("http")
async def automatic_audit_logging(request: Request, call_next):
    response = await call_next(request)

    method = request.method.upper()
    path = request.url.path

    module_names = {
        "products": "Products",
        "customers": "Customers",
        "suppliers": "Suppliers",
        "raw-materials": "Inventory",
        "purchases": "Purchases",
        "finished-goods": "Finished Goods",
        "production": "Production",
        "sales-orders": "Sales Orders",
        "gst-invoices": "GST Invoices",
        "payments": "Payments",
        "costing": "Costing"
    }

    if (
        method in ["POST", "PUT", "PATCH", "DELETE"]
        and response.status_code < 400
        and not path.startswith("/audit-logs")
    ):
        first_path = path.strip("/").split("/")[0]
        module = module_names.get(first_path, "Other")

        action_names = {
            "POST": "Create",
            "PUT": "Update",
            "PATCH": "Update",
            "DELETE": "Delete"
        }

        db = SessionLocal()

        try:
            audit = AuditLog(
                user_email=request.headers.get(
                    "x-user-email", "System"
                ),
                user_role=request.headers.get(
                    "x-user-role", "System"
                ),
                action=action_names[method],
                module=module,
                details=f"{method} {path} - Status {response.status_code}"
            )

            db.add(audit)
            db.commit()

        except Exception as error:
            db.rollback()
            print("Audit logging error:", error)

        finally:
            db.close()

    return response


# =====================================
# HOME AND HEALTH CHECK
# =====================================

@app.get("/")
def home():
    return {
        "message": "South Indian Traditional Dishes API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "configured"
    }


# =====================================
# AUDIT LOG APIs
# =====================================

@app.post("/audit-logs")
def create_audit_log(
    log: AuditLogCreate,
    db: Session = Depends(get_db)
):
    new_log = AuditLog(**log.model_dump())

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "message": "Audit log created successfully",
        "id": new_log.id
    }


@app.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(
        AuditLog.id.desc()
    ).all()

    return [
        {
            "id": log.id,
            "user_email": log.user_email,
            "user_role": log.user_role,
            "action": log.action,
            "module": log.module,
            "details": log.details,
            "created_at": (
                log.created_at.isoformat()
                if log.created_at else None
            )
        }
        for log in logs
    ]


# =====================================
# PRODUCT APIs
# =====================================

@app.get("/products", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.asc()).all()


@app.post("/products", response_model=ProductResponse)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    name = data.name.strip()

    if not name:
        raise HTTPException(400, "Product name is required")

    if db.query(Product).filter(Product.name == name).first():
        raise HTTPException(400, "Product name already exists")

    product = Product(**{**data.model_dump(), "name": name})

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@app.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Product not found")

    updates = data.model_dump(exclude_unset=True)

    if "name" in updates:
        updates["name"] = updates["name"].strip()

        if not updates["name"]:
            raise HTTPException(400, "Product name is required")

        duplicate = db.query(Product).filter(
            Product.name == updates["name"],
            Product.id != product_id
        ).first()

        if duplicate:
            raise HTTPException(400, "Product name already exists")

    for key, value in updates.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Product not found")

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}


# =====================================
# CUSTOMER APIs
# =====================================

@app.get("/customers", response_model=list[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.id.asc()).all()


@app.post("/customers", response_model=CustomerResponse)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(400, "Customer name is required")

    customer = Customer(
        **{**data.model_dump(), "name": data.name.strip()}
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@app.put("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    updates = data.model_dump(exclude_unset=True)

    if "name" in updates:
        updates["name"] = updates["name"].strip()

        if not updates["name"]:
            raise HTTPException(400, "Customer name is required")

    for key, value in updates.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    db.delete(customer)
    db.commit()

    return {"message": "Customer deleted successfully"}


# =====================================
# SUPPLIER APIs
# =====================================

@app.get("/suppliers", response_model=list[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.id.asc()).all()


@app.post("/suppliers", response_model=SupplierResponse)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(400, "Supplier name is required")

    supplier = Supplier(
        **{**data.model_dump(), "name": data.name.strip()}
    )

    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier


@app.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(404, "Supplier not found")

    updates = data.model_dump(exclude_unset=True)

    if "name" in updates:
        updates["name"] = updates["name"].strip()

        if not updates["name"]:
            raise HTTPException(400, "Supplier name is required")

    for key, value in updates.items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)

    return supplier


@app.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(404, "Supplier not found")

    db.delete(supplier)
    db.commit()

    return {"message": "Supplier deleted successfully"}


# =====================================
# RAW MATERIAL INVENTORY APIs
# =====================================

@app.get("/raw-materials", response_model=list[RawMaterialResponse])
def get_raw_materials(db: Session = Depends(get_db)):
    return db.query(RawMaterial).order_by(RawMaterial.id.asc()).all()


@app.post("/raw-materials", response_model=RawMaterialResponse)
def create_raw_material(
    data: RawMaterialCreate,
    db: Session = Depends(get_db)
):
    material_name = data.material.strip()

    if not material_name:
        raise HTTPException(400, "Material name is required")

    if data.quantity < 0 or data.minimum_stock < 0:
        raise HTTPException(400, "Stock quantities cannot be negative")

    if not data.unit.strip():
        raise HTTPException(400, "Unit is required")

    existing = db.query(RawMaterial).filter(
        RawMaterial.material == material_name
    ).first()

    if existing:
        raise HTTPException(400, "Material already exists")

    material = RawMaterial(
        material=material_name,
        quantity=data.quantity,
        unit=data.unit.strip(),
        minimum_stock=data.minimum_stock
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return material


@app.put("/raw-materials/{material_id}", response_model=RawMaterialResponse)
def update_raw_material(
    material_id: int,
    data: RawMaterialUpdate,
    db: Session = Depends(get_db)
):
    material = db.query(RawMaterial).filter(
        RawMaterial.id == material_id
    ).first()

    if not material:
        raise HTTPException(404, "Raw material not found")

    updates = data.model_dump(exclude_unset=True)

    if "material" in updates:
        updates["material"] = updates["material"].strip()

        if not updates["material"]:
            raise HTTPException(400, "Material name is required")

        duplicate = db.query(RawMaterial).filter(
            RawMaterial.material == updates["material"],
            RawMaterial.id != material_id
        ).first()

        if duplicate:
            raise HTTPException(400, "Material already exists")

    if "unit" in updates:
        updates["unit"] = updates["unit"].strip()

        if not updates["unit"]:
            raise HTTPException(400, "Unit is required")

    if "quantity" in updates and updates["quantity"] < 0:
        raise HTTPException(400, "Quantity cannot be negative")

    if "minimum_stock" in updates and updates["minimum_stock"] < 0:
        raise HTTPException(400, "Minimum stock cannot be negative")

    for key, value in updates.items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)

    return material


@app.delete("/raw-materials/{material_id}")
def delete_raw_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(RawMaterial).filter(
        RawMaterial.id == material_id
    ).first()

    if not material:
        raise HTTPException(404, "Raw material not found")

    db.delete(material)
    db.commit()

    return {"message": "Raw material deleted successfully"}


# =====================================
# PURCHASE APIs
# =====================================

@app.get("/purchases", response_model=list[PurchaseResponse])
def get_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).order_by(Purchase.id.desc()).all()


@app.post("/purchases", response_model=PurchaseResponse)
def create_purchase(data: PurchaseCreate, db: Session = Depends(get_db)):
    if data.quantity <= 0:
        raise HTTPException(400, "Purchase quantity must be greater than zero")

    if data.price < 0:
        raise HTTPException(400, "Price cannot be negative")

    material_name = data.material.strip()
    supplier_name = data.supplier.strip()

    material = db.query(RawMaterial).filter(
        RawMaterial.material == material_name
    ).with_for_update().first()

    if not material:
        raise HTTPException(404, "Raw material not found")

    if material.unit.lower() != data.unit.strip().lower():
        raise HTTPException(400, f"Unit mismatch. Inventory unit is {material.unit}")

    supplier = db.query(Supplier).filter(
        Supplier.name == supplier_name
    ).first()

    if not supplier:
        raise HTTPException(404, "Supplier not found")

    purchase = Purchase(
        supplier=supplier_name,
        material=material_name,
        quantity=data.quantity,
        unit=material.unit,
        price=data.price,
        total=data.quantity * data.price,
        date=data.date
    )

    try:
        material.quantity += data.quantity
        db.add(purchase)
        db.commit()
        db.refresh(purchase)
        return purchase
    except Exception:
        db.rollback()
        raise HTTPException(500, "Purchase could not be saved")


@app.delete("/purchases/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id
    ).first()

    if not purchase:
        raise HTTPException(404, "Purchase not found")

    material = db.query(RawMaterial).filter(
        RawMaterial.material == purchase.material
    ).with_for_update().first()

    if not material:
        raise HTTPException(404, "Related raw material not found")

    if material.quantity < purchase.quantity:
        raise HTTPException(
            400,
            "Cannot reverse purchase because stock has already been used"
        )

    try:
        material.quantity -= purchase.quantity
        db.delete(purchase)
        db.commit()
        return {"message": "Purchase deleted and stock adjusted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(500, "Purchase could not be deleted")


# =====================================
# FINISHED GOODS APIs
# =====================================

@app.get("/finished-goods", response_model=list[FinishedProductResponse])
def get_finished_goods(db: Session = Depends(get_db)):
    return db.query(FinishedProduct).order_by(
        FinishedProduct.id.asc()
    ).all()


@app.post("/finished-goods", response_model=FinishedProductResponse)
def create_finished_product(
    data: FinishedProductCreate,
    db: Session = Depends(get_db)
):
    name = data.name.strip()

    if not name:
        raise HTTPException(400, "Product name is required")

    if data.quantity < 0 or data.minimum_stock < 0:
        raise HTTPException(400, "Stock cannot be negative")

    if db.query(FinishedProduct).filter(
        FinishedProduct.name == name
    ).first():
        raise HTTPException(400, "Finished product already exists")

    product = FinishedProduct(
        **{**data.model_dump(), "name": name}
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@app.put("/finished-goods/{product_id}", response_model=FinishedProductResponse)
def update_finished_product(
    product_id: int,
    data: FinishedProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(FinishedProduct).filter(
        FinishedProduct.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Finished product not found")

    updates = data.model_dump(exclude_unset=True)

    if "name" in updates:
        updates["name"] = updates["name"].strip()

        if not updates["name"]:
            raise HTTPException(400, "Product name is required")

    if "quantity" in updates and updates["quantity"] < 0:
        raise HTTPException(400, "Quantity cannot be negative")

    if "minimum_stock" in updates and updates["minimum_stock"] < 0:
        raise HTTPException(400, "Minimum stock cannot be negative")

    for key, value in updates.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


@app.delete("/finished-goods/{product_id}")
def delete_finished_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(FinishedProduct).filter(
        FinishedProduct.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Finished product not found")

    db.delete(product)
    db.commit()

    return {"message": "Finished product deleted successfully"}


# =====================================
# PRODUCTION APIs
# =====================================

@app.get("/production", response_model=list[ProductionBatchResponse])
def get_production_batches(db: Session = Depends(get_db)):
    return db.query(ProductionBatch).order_by(
        ProductionBatch.id.desc()
    ).all()


@app.post("/production", response_model=ProductionBatchResponse)
def create_production_batch(
    data: ProductionBatchCreate,
    db: Session = Depends(get_db)
):
    try:
        if data.quantity <= 0:
            raise HTTPException(400, "Production quantity must be greater than zero")

        if db.query(ProductionBatch).filter(
            ProductionBatch.batch_no == data.batch_no
        ).first():
            raise HTTPException(400, "Batch number already exists")

        finished_product = db.query(FinishedProduct).filter(
            (FinishedProduct.name == data.product) |
            (FinishedProduct.category == data.product)
        ).with_for_update().first()

        if not finished_product:
            raise HTTPException(404, "Finished product not found")

        if not data.recipe:
            raise HTTPException(400, "Production recipe is required")

        deductions = []

        for item in data.recipe:
            material_name = item.get("material")
            unit_quantity = Decimal(str(item.get("quantity", 0)))
            unit = item.get("unit")

            if not material_name or unit_quantity <= 0 or not unit:
                raise HTTPException(400, "Invalid recipe ingredient")

            raw_material = db.query(RawMaterial).filter(
                RawMaterial.material == material_name
            ).with_for_update().first()

            if not raw_material:
                raise HTTPException(404, f"Raw material not found: {material_name}")

            if raw_material.unit.lower() != unit.lower():
                raise HTTPException(400, f"Unit mismatch for {material_name}")

            required_quantity = unit_quantity * data.quantity

            if raw_material.quantity < required_quantity:
                raise HTTPException(400, f"Insufficient stock for {material_name}")

            deductions.append((raw_material, required_quantity))

        for raw_material, required_quantity in deductions:
            raw_material.quantity -= required_quantity

        finished_product.quantity += data.quantity

        batch = ProductionBatch(
            batch_no=data.batch_no,
            product=finished_product.name,
            quantity=data.quantity,
            date=data.date,
            status="Completed",
            recipe=data.recipe
        )

        db.add(batch)
        db.commit()
        db.refresh(batch)

        return batch

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            500,
            "Production failed. Database changes were rolled back."
        )


# =====================================
# SALES ORDER APIs
# =====================================

@app.get("/sales-orders", response_model=list[SalesOrderResponse])
def get_sales_orders(db: Session = Depends(get_db)):
    return db.query(SalesOrder).order_by(
        SalesOrder.id.desc()
    ).all()


@app.post("/sales-orders", response_model=SalesOrderResponse)
def create_sales_order(
    data: SalesOrderCreate,
    db: Session = Depends(get_db)
):
    if data.quantity <= 0 or data.price <= 0:
        raise HTTPException(400, "Quantity and price must be greater than zero")

    if not data.order_no.strip():
        raise HTTPException(400, "Order number is required")

    if db.query(SalesOrder).filter(
        SalesOrder.order_no == data.order_no.strip()
    ).first():
        raise HTTPException(400, "Order number already exists")

    customer = db.query(Customer).filter(
        Customer.name == data.customer
    ).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    product = db.query(FinishedProduct).filter(
        FinishedProduct.name == data.product
    ).first()

    if not product:
        raise HTTPException(404, "Finished product not found")

    if product.quantity < data.quantity:
        raise HTTPException(400, "Insufficient finished goods stock")

    order = SalesOrder(
        order_no=data.order_no.strip(),
        customer=data.customer,
        product=data.product,
        quantity=data.quantity,
        price=data.price,
        total=data.quantity * data.price,
        date=data.date,
        status="Pending",
        district=data.district
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


@app.put("/sales-orders/{order_id}", response_model=SalesOrderResponse)
def update_sales_order(
    order_id: int,
    data: SalesOrderUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(SalesOrder).filter(
        SalesOrder.id == order_id
    ).with_for_update().first()

    if not order:
        raise HTTPException(404, "Sales order not found")

    updates = data.model_dump(exclude_unset=True)
    new_status = updates.get("status")

    if "status" in updates:
        transitions = {
            "Pending": "Confirmed",
            "Confirmed": "Dispatched",
            "Dispatched": "Delivered"
        }

        if new_status != order.status:
            if transitions.get(order.status) != new_status:
                raise HTTPException(
                    400,
                    f"Invalid status transition from {order.status} to {new_status}"
                )

            if new_status == "Dispatched":
                product = db.query(FinishedProduct).filter(
                    FinishedProduct.name == order.product
                ).with_for_update().first()

                if not product:
                    raise HTTPException(404, "Finished product not found")

                if product.quantity < order.quantity:
                    raise HTTPException(400, "Insufficient stock to dispatch order")

                product.quantity -= order.quantity

        order.status = new_status

    if "district" in updates:
        order.district = updates["district"]

    db.commit()
    db.refresh(order)

    return order


# =====================================
# GST INVOICE APIs
# =====================================

@app.get("/gst-invoices", response_model=list[GSTInvoiceResponse])
def get_gst_invoices(db: Session = Depends(get_db)):
    return db.query(GSTInvoice).order_by(
        GSTInvoice.id.desc()
    ).all()


@app.post("/gst-invoices", response_model=GSTInvoiceResponse)
def create_gst_invoice(
    data: GSTInvoiceCreate,
    db: Session = Depends(get_db)
):
    if data.quantity <= 0 or data.price <= 0:
        raise HTTPException(400, "Quantity and price must be greater than zero")

    allowed_rates = [
        Decimal("0"), Decimal("5"), Decimal("12"),
        Decimal("18"), Decimal("28")
    ]

    if data.gst_rate not in allowed_rates:
        raise HTTPException(400, "Invalid GST rate")

    if data.invoice_type not in ["Intra-state", "Inter-state"]:
        raise HTTPException(400, "Invalid invoice type")

    if db.query(GSTInvoice).filter(
        GSTInvoice.invoice_no == data.invoice_no.strip()
    ).first():
        raise HTTPException(400, "Invoice number already exists")

    customer = db.query(Customer).filter(
        Customer.name == data.customer
    ).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    product = db.query(FinishedProduct).filter(
        FinishedProduct.name == data.product
    ).first()

    if not product:
        raise HTTPException(404, "Finished product not found")

    taxable = data.quantity * data.price

    tax = (taxable * data.gst_rate / Decimal("100")).quantize(
        Decimal("0.01")
    )

    if data.invoice_type == "Intra-state":
        cgst = (tax / Decimal("2")).quantize(Decimal("0.01"))
        sgst = tax - cgst
        igst = Decimal("0.00")
    else:
        cgst = Decimal("0.00")
        sgst = Decimal("0.00")
        igst = tax

    invoice = GSTInvoice(
        invoice_no=data.invoice_no.strip(),
        customer=data.customer,
        product=data.product,
        quantity=data.quantity,
        price=data.price,
        taxable_amount=taxable,
        gst_rate=data.gst_rate,
        cgst=cgst,
        sgst=sgst,
        igst=igst,
        total=taxable + cgst + sgst + igst,
        invoice_type=data.invoice_type,
        date=data.date
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return invoice


# =====================================
# PAYMENT APIs
# =====================================

@app.get("/payments", response_model=list[PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    return db.query(Payment).order_by(
        Payment.id.desc()
    ).all()


@app.post("/payments", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db)
):
    if data.amount <= 0:
        raise HTTPException(400, "Payment amount must be greater than zero")

    if data.method not in ["Cash", "UPI", "Bank Transfer", "Card"]:
        raise HTTPException(400, "Invalid payment method")

    if db.query(Payment).filter(
        Payment.payment_no == data.payment_no.strip()
    ).first():
        raise HTTPException(400, "Payment number already exists")

    invoice = db.query(GSTInvoice).filter(
        GSTInvoice.invoice_no == data.invoice_no
    ).with_for_update().first()

    if not invoice:
        raise HTTPException(404, "Invoice not found")

    if invoice.customer != data.customer:
        raise HTTPException(400, "Customer does not match invoice")

    previous_payments = db.query(Payment).filter(
        Payment.invoice_no == data.invoice_no,
        Payment.status == "Completed"
    ).all()

    paid_amount = sum(
        (payment.amount for payment in previous_payments),
        Decimal("0.00")
    )

    balance = invoice.total - paid_amount

    if data.amount > balance:
        raise HTTPException(
            400,
            f"Payment exceeds outstanding balance of {balance}"
        )

    payment = Payment(
        payment_no=data.payment_no.strip(),
        invoice_no=data.invoice_no,
        customer=data.customer,
        amount=data.amount,
        method=data.method,
        date=data.date,
        status="Completed"
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


@app.put("/payments/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).with_for_update().first()

    if not payment:
        raise HTTPException(404, "Payment not found")

    if data.status is not None:
        if payment.status != "Pending" or data.status != "Completed":
            raise HTTPException(
                400,
                "Only Pending payments can be marked Completed"
            )

        invoice = db.query(GSTInvoice).filter(
            GSTInvoice.invoice_no == payment.invoice_no
        ).with_for_update().first()

        if not invoice:
            raise HTTPException(404, "Invoice not found")

        previous_payments = db.query(Payment).filter(
            Payment.invoice_no == payment.invoice_no,
            Payment.status == "Completed",
            Payment.id != payment.id
        ).all()

        paid_amount = sum(
            (item.amount for item in previous_payments),
            Decimal("0.00")
        )

        if paid_amount + payment.amount > invoice.total:
            raise HTTPException(
                400,
                "Payment exceeds remaining invoice balance"
            )

        payment.status = "Completed"

    db.commit()
    db.refresh(payment)

    return payment


# =====================================
# COSTING APIs
# =====================================

@app.get("/costing", response_model=list[CostRecordResponse])
def get_cost_records(db: Session = Depends(get_db)):
    return db.query(CostRecord).order_by(
        CostRecord.id.desc()
    ).all()


@app.post("/costing", response_model=CostRecordResponse)
def create_cost_record(
    data: CostRecordCreate,
    db: Session = Depends(get_db)
):
    if data.batch_quantity <= 0:
        raise HTTPException(400, "Batch quantity must be greater than zero")

    costs = [
        data.material_cost,
        data.labour_cost,
        data.packaging_cost,
        data.other_cost
    ]

    if any(cost < 0 for cost in costs):
        raise HTTPException(400, "Costs cannot be negative")

    if data.selling_price < 0:
        raise HTTPException(400, "Selling price cannot be negative")

    product = db.query(FinishedProduct).filter(
        FinishedProduct.name == data.product
    ).first()

    if not product:
        raise HTTPException(404, "Finished product not found")

    total_cost = sum(costs, Decimal("0.00"))

    cost_per_packet = (
        total_cost / Decimal(data.batch_quantity)
    ).quantize(Decimal("0.01"))

    profit_per_packet = (
        data.selling_price - cost_per_packet
    ).quantize(Decimal("0.01"))

    record = CostRecord(
        product=data.product,
        batch_quantity=data.batch_quantity,
        material_cost=data.material_cost,
        labour_cost=data.labour_cost,
        packaging_cost=data.packaging_cost,
        other_cost=data.other_cost,
        selling_price=data.selling_price,
        total_cost=total_cost,
        cost_per_packet=cost_per_packet,
        profit_per_packet=profit_per_packet,
        date=data.date
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record
