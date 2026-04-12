require("dotenv").config();

const path = require("path");
const mongoose = require("mongoose");
const Novel = require("../models/novel");
const TaiKhoan = require("../models/taikhoan");

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

function toPublicImagePath(value, folderPrefix) {
  if (!value) return value;

  const raw = String(value).trim();
  if (!raw) return raw;

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("//") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  const normalized = raw.replace(/\\/g, "/");

  if (normalized.startsWith("/images/uploads/") || normalized.startsWith("/uploads/")) {
    return normalized;
  }

  if (normalized.startsWith("C:/fakepath/")) {
    const fileName = path.posix.basename(normalized);
    return `${folderPrefix}/${fileName}`;
  }

  if (normalized.includes("/images/uploads/")) {
    const idx = normalized.lastIndexOf("/images/uploads/");
    return normalized.slice(idx);
  }

  if (normalized.includes("/uploads/")) {
    const idx = normalized.lastIndexOf("/uploads/");
    return normalized.slice(idx);
  }

  if (!normalized.includes("/")) {
    return `${folderPrefix}/${normalized}`;
  }

  return raw;
}

async function normalizeCollection(Model, fieldName, folderPrefix, name) {
  let scanned = 0;
  let updated = 0;

  const cursor = Model.find({}, { [fieldName]: 1 }).cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned += 1;
    const current = doc[fieldName];
    const next = toPublicImagePath(current, folderPrefix);

    if (next !== current) {
      await Model.updateOne({ _id: doc._id }, { $set: { [fieldName]: next } });
      updated += 1;
      console.log(`[${name}] Updated ${doc._id}: ${current} -> ${next}`);
    }
  }

  return { scanned, updated };
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const novelResult = await normalizeCollection(Novel, "HinhAnh", "/images/uploads", "Novel");
  const accountResult = await normalizeCollection(TaiKhoan, "HinhAnh", "/uploads", "TaiKhoan");

  console.log("--- Summary ---");
  console.log(`Novel: scanned=${novelResult.scanned}, updated=${novelResult.updated}`);
  console.log(`TaiKhoan: scanned=${accountResult.scanned}, updated=${accountResult.updated}`);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
