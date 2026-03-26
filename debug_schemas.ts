
import { advancedReportQuerySchema } from "./lib/validations/reports";
import { updateSupplierSchema } from "./lib/validations/suppliers";
import { z } from "zod";

function testAdvancedReport() {
  console.log("Testing Advanced Report Schema:");
  const data = {
    from_date: "2026-03-01",
    to_date: "2026-03-31",
    group_by: "day",
    dimension: "account"
  };
  const result = advancedReportQuerySchema.safeParse(data);
  if (result.success) {
    console.log("✅ Advanced Report Validation Success");
  } else {
    console.log("❌ Advanced Report Validation Failed");
    console.log(JSON.stringify(result.error.flatten(), null, 2));
  }
}

function testSupplierUpdate() {
  console.log("\nTesting Supplier Update Schema:");
  const data = {
    name: "شركة الأمل",
    phone: "0790000000",
    address: "إربد",
    is_active: true,
    supplier_id: "11111111-1111-1111-8111-111111111111"
  };
  const result = updateSupplierSchema.safeParse(data);
  if (result.success) {
    console.log("✅ Supplier Update Validation Success");
  } else {
    console.log("❌ Supplier Update Validation Failed");
    console.log(JSON.stringify(result.error.flatten(), null, 2));
  }
}

testAdvancedReport();
testSupplierUpdate();
