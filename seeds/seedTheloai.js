const mongoose = require("mongoose");
const TheLoai = require("../models/theloai");

const uri =
  process.env.MONGO_URI ||
  "mongodb://admin:admin123@ac-exoafeo-shard-00-02.dmubves.mongodb.net:27017/trangtruyenchu?ssl=true&authSource=admin";

const sampleTheLoai = [
  "Tiên hiệp",
  "Huyền huyễn",
  "Kiếm hiệp",
  "Ngôn tình",
  "Đô thị",
  "Xuyên không",
  "Trọng sinh",
  "Dị giới",
  "Mạt thế",
  "Khoa huyễn",
  "Lịch sử",
  "Trinh thám",
  "Hệ thống",
  "Cung đấu",
  "Điền văn",
  "Sủng",
  "Tu chân",
  "Linh dị",
  "Quân sự",
  "Dã sử"
];

async function seedTheLoai() {
  try {
    await mongoose.connect(uri);

    const existing = await TheLoai.find({}, { tentheloai: 1, _id: 0 }).lean();
    const existingSet = new Set(existing.map((item) => item.tentheloai.trim().toLowerCase()));

    const docsToInsert = sampleTheLoai
      .filter((name) => !existingSet.has(name.trim().toLowerCase()))
      .map((name) => ({ tentheloai: name }));

    if (docsToInsert.length === 0) {
      console.log("Khong co the loai moi de them.");
      return;
    }

    await TheLoai.insertMany(docsToInsert, { ordered: false });

    console.log(`Da them ${docsToInsert.length} the loai mau.`);
  } catch (error) {
    console.error("Seed that bai:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedTheLoai();
