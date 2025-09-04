import { supabase } from "./src/config/supabase.js";
import fs from "fs";
import { parse } from "csv-parse";

async function importProducts() {
  console.log("🚀 Starting product import...");

  try {
    // Read and parse CSV file
    const csvData = fs.readFileSync("./products_import.csv", "utf8");

    const products = [];

    // Parse CSV
    parse(
      csvData,
      {
        columns: true,
        skip_empty_lines: true,
      },
      (err, records) => {
        if (err) {
          console.error("❌ CSV parsing error:", err);
          return;
        }

        // Transform CSV data to match your database schema
        const transformedProducts = records.map((record) => ({
          name: record.name,
          category: record.category,
          selling_price: parseFloat(record.price),
          cost_price: parseFloat(record.cost_price),
          stock: parseInt(record.stock),
          pieces_per_sheet: parseInt(record.pieces_per_sheet),
          sheets_per_box: parseInt(record.sheets_per_box),
          total_pieces_per_box:
            parseInt(record.pieces_per_sheet) * parseInt(record.sheets_per_box),
          description: record.description,
          manufacturer: record.manufacturer,
          brand_name: record.manufacturer, // Use manufacturer as brand name
          generic_name: record.name, // Use name as generic name for now
          is_archived: false,
          reorder_level: 10, // Default reorder level
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Import products in batches
        importInBatches(transformedProducts);
      }
    );
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

async function importInBatches(products) {
  const batchSize = 50;
  let imported = 0;
  let failed = 0;

  console.log(
    `📦 Importing ${products.length} products in batches of ${batchSize}...`
  );

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    try {
      const { data, error } = await supabase
        .from("products")
        .insert(batch)
        .select("id, name");

      if (error) {
        console.error(
          `❌ Batch ${Math.floor(i / batchSize) + 1} failed:`,
          error
        );
        failed += batch.length;
      } else {
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1} imported: ${
            data.length
          } products`
        );
        imported += data.length;
      }
    } catch (batchError) {
      console.error(
        `❌ Batch ${Math.floor(i / batchSize) + 1} error:`,
        batchError
      );
      failed += batch.length;
    }
  }

  console.log("📊 Import Summary:");
  console.log(`   ✅ Successfully imported: ${imported} products`);
  console.log(`   ❌ Failed to import: ${failed} products`);

  if (imported > 0) {
    console.log(
      "🎉 Products imported successfully! Your search should now work."
    );
  }
}

// Run the import
importProducts();
