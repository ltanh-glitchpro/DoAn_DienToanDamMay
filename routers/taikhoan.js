var express = require("express");
var router = express.Router();
var bcrypt = require("bcryptjs");
var saltRounds = 10;
var TaiKhoan = require("../models/taikhoan");
var sendMail = require("../utils/sendMail");
var multer = require("multer");
var path = require("path");
var fs = require("fs");
const mongoose = require("mongoose");
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

// Cấu hình multer lưu ảnh đại diện
const uploadDir = uploadPaths.avatarUploadDir;
uploadPaths.ensureUploadDirectories();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
var upload = multer({ storage: storage });

// GET: Danh sách tài khoản
router.get("/", requireAdmin, async (req, res) => {
  var tk = await TaiKhoan.find();
  res.render("taikhoan", {
    title: "Danh sách tài khoản",
    taikhoan: tk,
  });
});

// GET: Thêm tài khoản
router.get("/them", requireAdmin, async (req, res) => {
  res.render("taikhoan_them", {
    title: "Thêm tài khoản",
  });
});

// POST: Thêm tài khoản
router.post("/them", requireAdmin, upload.single("HinhAnh"), async (req, res) => {
  try {
    var plainPassword = req.body.MatKhau;
    const HinhAnh = req.file ? "/uploads/" + req.file.filename : (req.body.HinhAnh || "");
    var data = {
      HoVaTen: req.body.HoVaTen,
      Email: req.body.Email,
      HinhAnh: HinhAnh,
      TenDangNhap: req.body.TenDangNhap,
      MatKhau: bcrypt.hashSync(plainPassword, saltRounds),
    };
    await TaiKhoan.create(data);

    if (data.Email) {
      var htmlContent = `
        <h3>Xin chào ${data.HoVaTen || "bạn"},</h3>
        <p>Tài khoản của bạn đã được quản trị viên tạo trên hệ thống.</p>
        <p><b>Tên đăng nhập:</b> ${data.TenDangNhap}</p>
        <p><b>Mật khẩu:</b> ${plainPassword}</p>
        <p>Vui lòng đăng nhập và đổi mật khẩu để đảm bảo an toàn.</p>
      `;

      try {
        await sendMail(data.Email, "Thông tin tài khoản đăng nhập", htmlContent);
        req.session.success = "Đã thêm tài khoản và gửi email thành công.";
      } catch (mailError) {
        console.error("Gửi email tạo tài khoản thất bại:", mailError.message || mailError);
        req.session.success = "Đã thêm tài khoản thành công, nhưng chưa gửi được email.";
      }
    } else {
      req.session.success = "Đã thêm tài khoản thành công.";
    }

    return res.redirect("/taikhoan");
  } catch (error) {
    console.error("Lỗi thêm tài khoản:", error);
    req.session.error = "Không thể thêm tài khoản. Vui lòng kiểm tra dữ liệu và thử lại.";
    return res.redirect("/error");
  }
});

router.get("/them_admin", requireAdmin, async (req, res) => {
  res.render("taikhoan_them_admin", {
    title: "Thêm tài khoản",
  });
});

// POST: Thêm tài khoản dạng admin
router.post("/them_admin", requireAdmin, upload.single("HinhAnh"), async (req, res) => {
  try {
    var plainPassword = req.body.MatKhau;
    var data = {
      HoVaTen: req.body.HoVaTen,
      Email: req.body.Email,
      TenDangNhap: req.body.TenDangNhap,
      QuyenHan: req.body.role,
      MatKhau: bcrypt.hashSync(plainPassword, saltRounds),
    };

    if (req.file) {
      data.HinhAnh = "/uploads/" + req.file.filename;
    }

    await TaiKhoan.create(data);

    if (data.Email) {
      var htmlContent = `
        <h3>Xin chào ${data.HoVaTen || "bạn"},</h3>
        <p>Tài khoản của bạn đã được quản trị viên tạo trên hệ thống.</p>
        <p><b>Tên đăng nhập:</b> ${data.TenDangNhap}</p>
        <p><b>Mật khẩu:</b> ${plainPassword}</p>
        <p><b>Quyền hạn:</b> ${data.QuyenHan}</p>
        <p>Vui lòng đăng nhập và đổi mật khẩu để đảm bảo an toàn.</p>
      `;

      try {
        await sendMail(data.Email, "Thông tin tài khoản đăng nhập", htmlContent);
        req.session.success = "Đã thêm tài khoản và gửi email thành công.";
      } catch (mailError) {
        console.error("Gửi email tạo tài khoản admin thất bại:", mailError.message || mailError);
        req.session.success = "Đã thêm tài khoản thành công, nhưng chưa gửi được email.";
      }
    } else {
      req.session.success = "Đã thêm tài khoản thành công.";
    }

    return res.redirect("/taikhoan");
  } catch (error) {
    console.error("Lỗi thêm tài khoản admin:", error);
    req.session.error = "Không thể thêm tài khoản. Vui lòng kiểm tra dữ liệu và thử lại.";
    return res.redirect("/error");
  }
});

// GET: Sửa tài khoản
router.get("/sua/:id", requireAdmin, async (req, res) => {
  var id = req.params.id;
  var tk = await TaiKhoan.findById(id);
  res.render("taikhoan_sua", {
    title: "Sửa tài khoản",
    taikhoan: tk,
  });
});

// POST: Sửa tài khoản
router.post("/sua/:id", requireAdmin, upload.single("HinhAnh"), async (req, res) => {
  var id = req.params.id;
  var tk = await TaiKhoan.findById(id).select("HinhAnh").lean();
  var data = {
    HoVaTen: req.body.HoVaTen,
    Email: req.body.Email,
    HinhAnh: req.file ? "/uploads/" + req.file.filename : (tk ? tk.HinhAnh : ""),
    TenDangNhap: req.body.TenDangNhap,
    QuyenHan: req.body.QuyenHan,
    KichHoat: req.body.KichHoat,
  };
  if (req.body.MatKhau)
    data["MatKhau"] = bcrypt.hashSync(req.body.MatKhau, saltRounds);
  await TaiKhoan.findByIdAndUpdate(id, data);
  res.redirect("/taikhoan");
});

// GET: Sửa tài khoản user
router.get("/sua_user/:id", requireLogin, async (req, res) => {
  var id = req.params.id;

  // Kiểm tra id có phải ObjectId hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("ID không hợp lệ");
  }

  try {
    if (req.session.QuyenHan !== "admin" && String(req.session.MaNguoiDung) !== String(id)) {
      req.session.error = "Bạn không có quyền chỉnh sửa tài khoản này.";
      return res.redirect("/error");
    }

    var tk = await TaiKhoan.findById(id);
    if (!tk) {
      return res.status(404).send("Tài khoản không tồn tại");
    }
    res.render("taikhoan_sua_user", {
      title: "Sửa tài khoản",
      taikhoan: tk,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi server");
  }
});

router.post("/sua_user/:id", requireLogin, upload.single("HinhAnh"), async (req, res) => {
  var id = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.session.error = "ID tài khoản không hợp lệ.";
      return res.redirect("/error");
    }

    if (req.session.QuyenHan !== "admin" && String(req.session.MaNguoiDung) !== String(id)) {
      req.session.error = "Bạn không có quyền chỉnh sửa tài khoản này.";
      return res.redirect("/error");
    }

    var data = {
      HoVaTen: req.body.HoVaTen,
      Email: req.body.Email,
      TenDangNhap: req.body.TenDangNhap,
    };
    if (req.body.MatKhau)
      data["MatKhau"] = bcrypt.hashSync(req.body.MatKhau, saltRounds);

    if (req.file) {
      data["HinhAnh"] = "/uploads/" + req.file.filename;
    } else {
      var tk = await TaiKhoan.findById(id).select("HinhAnh").lean();
      if (tk) data["HinhAnh"] = tk.HinhAnh;
    }

    await TaiKhoan.findByIdAndUpdate(id, data);
    return res.redirect(`/taikhoan/hoso/${id}`);
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ người dùng:", error);
    req.session.error = "Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.";
    return res.redirect(`/taikhoan/sua_user/${id}`);
  }
});

// GET: Xóa tài khoản
router.get("/xoa/:id", requireAdmin, async (req, res) => {
  var id = req.params.id;
  await TaiKhoan.findByIdAndDelete(id);
  res.redirect("/taikhoan");
});

router.get("/hoso/:id", requireLogin, async (req, res) => {
  var id = req.params.id;

  if (req.session.QuyenHan !== "admin" && String(req.session.MaNguoiDung) !== String(id)) {
    req.session.error = "Bạn không có quyền xem hồ sơ này.";
    return res.redirect("/error");
  }

  var tk = await TaiKhoan.findById(id);
  res.render("taikhoan_hoso", {
    title: "Hồ sơ của tôi",
    taikhoan: tk,
  });
});

// GET: Duyệt bài viết
router.get("/duyet/:id", requireAdmin, async function (req, res) {
  var id = req.params.id;
  var tk = await TaiKhoan.findById(id);
  await TaiKhoan.findByIdAndUpdate(id, { KichHoat: 1 - tk.KichHoat });
  res.redirect("back");
});

module.exports = router;
