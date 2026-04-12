var express = require("express");
var router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

var TheLoai = require("../models/theloai");
var Novel = require("../models/novel");
var Chuong = require("../models/chuong"); // thêm model chương
var ThongBao = require("../models/thongbao");
var uploadPaths = require("../utils/uploadPaths");

function requireLogin(req, res, next) {
  if (req.session && req.session.MaNguoiDung) {
    return next();
  }
  req.session.error = "Bạn cần đăng nhập để tiếp tục.";
  return res.redirect("/auth/dangnhap");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.MaNguoiDung && req.session.QuyenHan === "admin") {
    return next();
  }
  req.session.error = "Bạn không có quyền truy cập chức năng này.";
  return res.redirect("/error");
}

async function requireNovelOwnerOrAdmin(req, res, next) {
  try {
    const novel = await Novel.findById(req.params.id).select("TaiKhoan").lean();
    if (!novel) {
      req.session.error = "Không tìm thấy truyện.";
      return res.redirect("/error");
    }

    const isAdmin = req.session.QuyenHan === "admin";
    const isOwner = String(novel.TaiKhoan) === String(req.session.MaNguoiDung);

    if (!isAdmin && !isOwner) {
      req.session.error = "Bạn không có quyền thao tác truyện này.";
      return res.redirect("/error");
    }

    return next();
  } catch (error) {
    console.error(error);
    req.session.error = "Có lỗi xảy ra khi kiểm tra quyền truy cập.";
    return res.redirect("/error");
  }
}

// Tạo thư mục nếu chưa tồn tại
const uploadDir = uploadPaths.novelUploadDir;
uploadPaths.ensureUploadDirectories();

// Hàm tạo số random đơn giản, đảm bảo là số nguyên và khác nhau mỗi lần gọi
function generateRandomNumber() {
  return Math.floor(Math.random() * 1e9); // số nguyên từ 0 đến gần 1 tỷ
}

// Cấu hình lưu trữ ảnh bằng multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, uploadDir);
    } else {
      cb(new Error("Chỉ cho phép file hình ảnh jpg, png, webp"), false);
    }
  },
  filename: function (req, file, cb) {
    const randomNumber = generateRandomNumber();
    const extension = file.mimetype.split("/")[1];
    const fileName = randomNumber + "." + extension;
    cb(null, fileName);
  },
});
var upload = multer({ storage: storage });

// GET: Danh sách bài viết
router.get("/", requireAdmin, async function (req, res) {
  var tr = await Novel.find().populate("TheLoai").populate("TaiKhoan").exec();

  // Lặp qua từng truyện để tính số chương đã duyệt
  for (let item of tr) {
    let soChuong = await Chuong.countDocuments({
      Novel: item._id,
      KiemDuyet: 1, // chỉ đếm chương đã duyệt
    });
    item.SoChuong = soChuong;
  }

  // Sắp xếp: truyện chưa duyệt (KiemDuyet != 1) lên đầu
  tr.sort((a, b) => {
    return (a.KiemDuyet === 1 ? 1 : 0) - (b.KiemDuyet === 1 ? 1 : 0);
  });

  res.render("novel", {
    title: "Danh sách truyện",
    novel: tr,
  });
});

// GET: Đăng bài viết
router.get("/them", requireLogin, async function (req, res) {
  var tl = await TheLoai.find();
  res.render("novel_them", {
    title: "Đăng truyện",
    theloai: tl,
  });
});

// POST: Đăng bài viết
router.post("/them", requireLogin, upload.single("HinhAnh"), async function (req, res, next) {
  var isAdmin = req.session.QuyenHan === "admin";
  var kd = isAdmin ? 1 : 0;
  if (req.session.MaNguoiDung) {
    const file = req.file;
    if (!file) {
      const error = new Error("Hãy upload hình ảnh");
      res.redirect("/error");
      return;
    }
    const picURL = "/images/uploads/" + file.filename;
    var data = {
      TheLoai: req.body.MaTheLoai,
      TaiKhoan: req.session.MaNguoiDung,
      TieuDe: req.body.TieuDe,
      TomTat: req.body.TomTat,
      TrangThai: req.body.TrangThai || 0,
      KiemDuyet: kd,
      HinhAnh: picURL,
    };
    await Novel.create(data);
    req.session.success = isAdmin
      ? "Đã đăng truyện thành công và hiển thị ngay."
      : "Đã đăng truyện thành công và đang chờ admin kiểm duyệt.";
    res.redirect("/success");
  }
});

// GET: Sửa bài viết
router.get("/sua/:id", requireLogin, requireNovelOwnerOrAdmin, async function (req, res) {
  var id = req.params.id;
  var tl = await TheLoai.find();
  var tr = await Novel.findById(id);

  let lyDoTuChoi = null;
  if (tr && tr.KiemDuyet === 0) {
    const thongBao = await ThongBao.findOne({
      NguoiNhan: req.session.MaNguoiDung,
      MucTieuId: tr._id,
      Loai: "novel",
      TrangThai: "rejected",
    })
      .sort({ NgayTao: -1 })
      .lean();

    if (thongBao) {
      lyDoTuChoi = thongBao.NoiDung;
    }
  }

  res.render("novel_sua", {
    title: "Chỉnh sửa truyện",
    theloai: tl,
    novel: tr,
    lyDoTuChoi,
  });
});

// POST: Sửa bài viết
router.post(
  "/sua/:id",
  requireLogin,
  requireNovelOwnerOrAdmin,
  upload.single("HinhAnh"),
  async function (req, res, next) {
    var id = req.params.id;
    var isAdmin = req.session.QuyenHan === "admin";
    const file = req.file;
    const existingNovel = await Novel.findById(id).select("HinhAnh").lean();
    const picURL = file ? "/images/uploads/" + file.filename : (existingNovel ? existingNovel.HinhAnh : "");
    var data = {
      TheLoai: req.body.MaTheLoai,
      TieuDe: req.body.TieuDe,
      TomTat: req.body.TomTat,
      TrangThai: req.body.TrangThai || 0,
      KiemDuyet: isAdmin ? 1 : 0,
      HinhAnh: picURL,
    };
    await Novel.findByIdAndUpdate(id, data);

    if (!isAdmin) {
      // Sau khi tác giả chỉnh sửa gửi duyệt lại, các thông báo từ chối cũ được đánh dấu đã đọc.
      await ThongBao.updateMany(
        {
          NguoiNhan: req.session.MaNguoiDung,
          Loai: "novel",
          MucTieuId: id,
          TrangThai: "rejected",
          DaDoc: 0,
        },
        { $set: { DaDoc: 1 } }
      );
    }

    req.session.success = isAdmin
      ? "Đã cập nhật truyện thành công và hiển thị ngay."
      : "Đã cập nhật truyện thành công và đang chờ admin kiểm duyệt lại.";
    res.redirect("/success");
  }
);

// GET: Trang duyệt truyện
router.get("/duyet/:id", requireAdmin, async function (req, res) {
  try {
    var tr = await Novel.findById(req.params.id)
      .populate("TheLoai", "tentheloai")
      .populate("TaiKhoan", "HoVaTen")
      .lean();

    if (!tr) {
      req.session.error = "Không tìm thấy truyện để duyệt.";
      return res.redirect("/error");
    }

    return res.render("novel_duyet", {
      title: "Duyệt truyện",
      novel: tr,
    });
  } catch (error) {
    console.error(error);
    req.session.error = "Không thể tải trang duyệt truyện.";
    return res.redirect("/error");
  }
});

// POST: Duyệt hoặc từ chối truyện
router.post("/duyet/:id", requireAdmin, async function (req, res) {
  try {
    var tr = await Novel.findById(req.params.id).lean();
    if (!tr) {
      req.session.error = "Không tìm thấy truyện để duyệt.";
      return res.redirect("/error");
    }

    var action = req.body.action;
    var lyDo = String(req.body.lyDo || "").trim();
    if (!["approve", "reject"].includes(action)) {
      req.session.error = "Hành động duyệt truyện không hợp lệ.";
      return res.redirect("/error");
    }

    var newStatus = action === "approve" ? 1 : 0;
    await Novel.findByIdAndUpdate(req.params.id, { KiemDuyet: newStatus });

    var notificationText =
      action === "approve"
        ? `Truyện \"${tr.TieuDe}\" của bạn đã được admin duyệt.`
        : `Truyện \"${tr.TieuDe}\" của bạn chưa được duyệt.${lyDo ? ` Lý do: ${lyDo}` : ""}`;

    await ThongBao.create({
      NguoiNhan: tr.TaiKhoan,
      Loai: "novel",
      MucTieuId: tr._id,
      TieuDe: action === "approve" ? "Truyện đã được duyệt" : "Truyện chưa được duyệt",
      NoiDung: notificationText,
      TrangThai: action === "approve" ? "approved" : "rejected",
    });

    req.session.success =
      action === "approve"
        ? "Đã duyệt truyện thành công."
        : "Đã từ chối truyện và gửi thông báo cho tác giả.";
    return res.redirect("/novel");
  } catch (error) {
    console.error(error);
    req.session.error = "Không thể xử lý duyệt truyện.";
    return res.redirect("/error");
  }
});

// GET: Xóa bài viết
router.get("/xoa/:id", requireAdmin, async function (req, res) {
  var id = req.params.id;
  await Novel.findByIdAndDelete(id);
  res.redirect("back");
});

// POST: Xóa bài viết (chủ truyện hoặc admin)
router.post("/xoa/:id", requireLogin, requireNovelOwnerOrAdmin, async function (req, res) {
  var id = req.params.id;
  await Novel.findByIdAndDelete(id);

  if (req.session.QuyenHan === "admin") {
    return res.redirect("/novel");
  }

  return res.redirect("/novel/cuatoi");
});

// GET: Danh sách bài viết của tôi
router.get("/cuatoi", requireLogin, async function (req, res) {
  var id = req.session.MaNguoiDung;
  var filter = req.session.QuyenHan === "admin" ? {} : { TaiKhoan: id };

  var tr = await Novel.find(filter)
    .populate("TheLoai", "tentheloai")
    .populate("TaiKhoan")
    .exec();
  res.render("novel_cuatoi", {
    title: "Truyện của tôi",
    novel: tr,
  });
});

module.exports = router;
