var express = require("express");
var router = express.Router();
var Chuong = require("../models/chuong");
var Novel = require("../models/novel");
var TheLoai = require("../models/theloai"); // Nếu có
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Tạo thư mục images nếu chưa có
const imagesDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Cấu hình multer cho việc upload hình ảnh
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (
      ["image/jpg", "image/png", "image/jpeg", "image/webp"].includes(
        file.mimetype
      )
    ) {
      cb(null, "public/images");
    } else {
      cb(new Error("Không phải hình ảnh"), false);
    }
  },
  filename: function (req, file, cb) {
    var randomNumber = Math.floor(Math.random() * 1000000);
    cb(null, `${Date.now()}_${randomNumber}.jpg`);
  },
});
var upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware kiểm tra quyền admin
function isAdmin(req, res, next) {
  if (req.session.MaNguoiDung && req.session.QuyenHan === "admin") {
    return next();
  }
  return res.redirect("/error?message=Bạn không có quyền truy cập");
}

// GET: Danh sách tất cả chương, ưu tiên chương chưa duyệt lên đầu
router.get("/", async (req, res) => {
  try {
    // Sắp xếp theo KiemDuyet tăng dần: 0 (chưa duyệt) sẽ lên trước 1 (đã duyệt)
    // Có thể thêm thứ tự theo thời gian để mới nhất lên trên
    const ch = await Chuong.find()
      .populate("Novel")
      .populate("TaiKhoan")
      .sort({ KiemDuyet: 1, createdAt: -1 }) 
      .exec();

    const theloai = await TheLoai.find();
    res.render("chuong", {
      title: "Danh sách chương",
      chuong: ch,
      theloai: theloai,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Đã có lỗi xảy ra trong quá trình lấy dữ liệu");
  }
});

// GET: Trang đăng chương mới
router.get("/them", async (req, res) => {
  try {
    if (!req.session.MaNguoiDung) return res.redirect("/dangnhap");
    const tr = await Novel.find({ KiemDuyet: 1 })
      .populate("TheLoai")
      .sort({ NgayDang: -1 })
      .lean();
    res.render("chuong_them", {
      title: "Đăng chương",
      novel: tr,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Đã có lỗi xảy ra khi tải trang");
  }
});

// POST: Thêm chương mới
router.post("/them", upload.single("HinhAnh"), async (req, res) => {
  try {
    if (!req.session.MaNguoiDung) return res.redirect("/dangnhap");
    const { MaTruyen, TieuDe, NoiDung } = req.body;
    const newChuong = new Chuong({
      Novel: MaTruyen,
      TaiKhoan: req.session.MaNguoiDung,
      TieuDe,
      NoiDung,
      HinhAnh: req.file ? req.file.filename : "",
    });
    await newChuong.save();
    res.redirect("/chuong/cuatoi");
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi thêm chương");
  }
});

// GET: Danh sách chương của người dùng
router.get("/cuatoi", async (req, res) => {
  try {
    if (!req.session.MaNguoiDung) return res.redirect("/dangnhap");
    const ch = await Chuong.find({ TaiKhoan: req.session.MaNguoiDung })
      .populate("Novel")
      .populate("TaiKhoan");
    res.render("chuong_cuatoi", {
      title: "Chương truyện của tôi",
      chuong: ch,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi lấy danh sách chương");
  }
});

// POST: Tìm kiếm chương của tôi
router.post("/cuatoi", async (req, res) => {
  try {
    const { search } = req.body;
    const query = {
      TaiKhoan: req.session.MaNguoiDung,
      ...(search && { TieuDe: { $regex: search, $options: "i" } }),
    };
    const ch = await Chuong.find(query).populate("Novel").populate("TaiKhoan");
    res.render("chuong_cuatoi", {
      title: "Chương truyện của tôi",
      chuong: ch,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi tìm kiếm chương");
  }
});

// GET: Sửa chương
router.get("/sua/:id", async (req, res) => {
  try {
    const chuong = await Chuong.findById(req.params.id)
      .populate("Novel")
      .populate("TaiKhoan");
    if (!chuong) return res.redirect("/error?message=Chương không tồn tại");

    const novels = await Novel.find(); // <-- Phải là "novels" để khớp với biến trong EJS

    res.render("chuong_sua", {
      title: "Chỉnh sửa chương",
      chuong,
      novel: novels, // truyền đúng tên biến
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi tải trang chỉnh sửa");
  }
});

// POST: Cập nhật chương
router.post("/sua/:id", upload.single("HinhAnh"), async (req, res) => {
  try {
    const { MaTruyen, TieuDe, NoiDung } = req.body;
    const chuong = await Chuong.findById(req.params.id);
    if (!chuong) return res.redirect("/error?message=Chương không tồn tại");
    chuong.Novel = MaTruyen;
    chuong.TieuDe = TieuDe;
    chuong.NoiDung = NoiDung;
    if (req.file) chuong.HinhAnh = req.file.filename;
    await chuong.save();
    res.redirect("/chuong/cuatoi");
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi cập nhật chương");
  }
});

// POST: Xóa chương
router.post("/xoa/:id", async (req, res) => {
  try {
    await Chuong.findByIdAndDelete(req.params.id);
    res.redirect("/chuong");
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi xóa chương");
  }
});

//GET Duyet chuong
router.get("/duyet/:id", isAdmin, async (req, res) => {
  try {
    const chuong = await Chuong.findById(req.params.id)
      .populate("Novel")
      .populate("TaiKhoan");
    if (!chuong) return res.redirect("/chuong?error=Không tìm thấy chương");

    res.render("chuong_duyet", {
      title: "Duyệt chương",
      chuong,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/chuong?error=Lỗi khi tải trang duyệt chương");
  }
});

// POST: Duyệt hoặc từ chối chương
router.post("/duyet-chuong/:id", isAdmin, async (req, res) => {
  try {
    const chuong = await Chuong.findById(req.params.id);
    if (!chuong) return res.redirect("/chuong?error=Không tìm thấy chương");

    const { action } = req.body;

    if (action === "approve") {
      chuong.KiemDuyet = 1;
    } else if (action === "reject") {
      chuong.KiemDuyet = 0;
    } else {
      return res.redirect("/chuong?error=Hành động không hợp lệ");
    }

    await chuong.save();
    res.redirect("/chuong");
  } catch (err) {
    console.error(err);
    res.redirect("/chuong?error=Có lỗi xảy ra khi duyệt chương");
  }
});

module.exports = router;
