#!/usr/bin/env node

/**
 * Setup script to create the documents storage bucket in Supabase
 * Run with: node setup-storage.js
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log("Creating documents storage bucket...");

    // Create the bucket
    const { data: bucket, error: createError } =
      await supabase.storage.createBucket("documents", {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
        ],
      });

    if (createError) {
      if (createError.message.includes("already exists")) {
        console.log("✓ Documents bucket already exists");
      } else {
        throw createError;
      }
    } else {
      console.log("✓ Documents bucket created successfully");
    }

    console.log("\nStorage setup complete!");
    console.log("You can now upload documents to your issues and views.");
  } catch (error) {
    console.error("Error setting up storage:", error.message);
    console.error("\nPlease create the bucket manually:");
    console.error(
      "1. Go to https://supabase.com/dashboard/project/ogrbtmbmxyqyvwkajdrw/storage/buckets"
    );
    console.error('2. Click "New bucket"');
    console.error('3. Name it "documents"');
    console.error("4. Set it to Private");
    console.error("5. Set file size limit to 50MB");
    process.exit(1);
  }
}

setupStorage();
