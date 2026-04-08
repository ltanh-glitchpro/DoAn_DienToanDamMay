require("dotenv").config();

const mongoose = require("mongoose");
const Novel = require("../models/novel");
const TheLoai = require("../models/theloai");

async function run() {
  const uri =
    process.env.MONGO_URI ||
    "mongodb://admin:admin123@ac-exoafeo-shard-00-02.dmubves.mongodb.net:27017/trangtruyenchu?ssl=true&authSource=admin";

  await mongoose.connect(uri);

  const tl = await TheLoai.findOne({ tentheloai: /^tiên hiệp$/i }).lean();
  if (!tl) {
    throw new Error("Khong tim thay the loai Tien hiep");
  }

  const result = await Novel.updateOne(
    { TieuDe: /^Phàm Nhân Tu Tiên$/i },
    { $set: { TheLoai: tl._id } }
  );

  const check = await Novel.findOne({ TieuDe: /Phàm Nhân Tu Tiên/i })
    .populate("TheLoai")
    .lean();

  console.log("UPDATE_RESULT", result);
  console.log(
    "CHECK",
    JSON.stringify(
      {
        title: check ? check.TieuDe : null,
        theloai: check && check.TheLoai ? check.TheLoai.tentheloai : null,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
  }
  process.exit(1);
});
