var express = require("express");
var router = express.Router();
var Chuong = require("../models/chuong");
var Novel = require("../models/novel");
var TheLoai = require("../models/theloai"); // Nếu có
var ThongBao = require("../models/thongbao");
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

function requireLogin(req, res, next) {
  if (req.session && req.session.MaNguoiDung) {
    return next();
  }
  req.session.error = "Bạn cần đăng nhập để tiếp tục.";
  return res.redirect("/auth/dangnhap");
}

// Middleware kiểm tra quyền admin
function isAdmin(req, res, next) {
  if (req.session && req.session.MaNguoiDung && req.session.QuyenHan === "admin") {
    return next();
  }
  if (!req.session || !req.session.MaNguoiDung) {
    req.session.error = "Bạn cần đăng nhập để tiếp tục.";
    return res.redirect("/auth/dangnhap");
  }
  req.session.error = "Bạn không có quyền truy cập chức năng này.";
  return res.redirect("/error");
}

async function requireChapterOwnerOrAdmin(req, res, next) {
  try {
    const chapter = await Chuong.findById(req.params.id).select("TaiKhoan KiemDuyet").lean();
    if (!chapter) {
      req.session.error = "Chương không tồn tại.";
      return res.redirect("/error");
    }

    const isAdminRole = req.session.QuyenHan === "admin";
    const isOwner = String(chapter.TaiKhoan) === String(req.session.MaNguoiDung);

    if (!isAdminRole && !isOwner) {
      req.session.error = "Bạn không có quyền thao tác chương này.";
      return res.redirect("/error");
    }

    req.chapterAuth = chapter;
    return next();
  } catch (error) {
    console.error(error);
    req.session.error = "Lỗi kiểm tra quyền truy cập chương.";
    return res.redirect("/error");
  }
}

// GET: Danh sách tất cả chương, ưu tiên chương chưa duyệt lên đầu
router.get("/", isAdmin, async (req, res) => {
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
    if (!req.session.MaNguoiDung) return res.redirect("/auth/dangnhap");
    const isAdminRole = req.session.QuyenHan === "admin";
    const novelFilter = isAdminRole
      ? { KiemDuyet: 1 }
      : { KiemDuyet: 1, TaiKhoan: req.session.MaNguoiDung };

    const tr = await Novel.find(novelFilter)
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
    if (!req.session.MaNguoiDung) return res.redirect("/auth/dangnhap");
    const { MaTruyen, TieuDe, NoiDung } = req.body;
    const isAdmin = req.session.QuyenHan === "admin";

    const novelFilter = isAdmin
      ? { _id: MaTruyen, KiemDuyet: 1 }
      : { _id: MaTruyen, KiemDuyet: 1, TaiKhoan: req.session.MaNguoiDung };

    const selectedNovel = await Novel.findOne(novelFilter).select("_id").lean();
    if (!selectedNovel) {
      req.session.error = "Bạn chỉ có thể đăng chương vào truyện đã duyệt thuộc quyền quản lý của bạn.";
      return res.redirect("/error");
    }

    const newChuong = new Chuong({
      Novel: MaTruyen,
      TaiKhoan: req.session.MaNguoiDung,
      TieuDe,
      NoiDung,
      KiemDuyet: isAdmin ? 1 : 0,
    });
    await newChuong.save();
    req.session.success = isAdmin
      ? "Đã đăng chương thành công và hiển thị ngay."
      : "Đã đăng chương thành công và đang chờ admin kiểm duyệt.";
    res.redirect("/chuong/cuatoi");
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi thêm chương");
  }
});

// GET: Danh sách chương của người dùng
router.get("/cuatoi", async (req, res) => {
  try {
    if (!req.session.MaNguoiDung) return res.redirect("/auth/dangnhap");
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
router.get("/sua/:id", requireLogin, requireChapterOwnerOrAdmin, async (req, res) => {
  try {
    const chuong = await Chuong.findById(req.params.id)
      .populate("Novel")
      .populate("TaiKhoan");
    if (!chuong) return res.redirect("/error?message=Chương không tồn tại");

    const isAdminRole = req.session.QuyenHan === "admin";
    const novelFilter = isAdminRole
      ? { KiemDuyet: 1 }
      : { KiemDuyet: 1, TaiKhoan: req.session.MaNguoiDung };
    const novels = await Novel.find(novelFilter);

    // Lấy lý do từ chối gần nhất nếu chương chưa được duyệt
    let lyDoTuChoi = null;
    if (chuong.KiemDuyet === 0) {
      const thongBao = await ThongBao.findOne({
        MucTieuId: chuong._id,
        Loai: "chuong",
        TrangThai: "rejected"
      }).sort({ NgayTao: -1 }).lean();
      if (thongBao) {
        lyDoTuChoi = thongBao.NoiDung;
      }
    }

    res.render("chuong_sua", {
      title: "Chỉnh sửa chương",
      chuong,
      novel: novels, // truyền đúng tên biến
      lyDoTuChoi
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi tải trang chỉnh sửa");
  }
});

// POST: Cập nhật chương
router.post("/sua/:id", requireLogin, requireChapterOwnerOrAdmin, upload.single("HinhAnh"), async (req, res) => {
  try {
    const { MaTruyen, TieuDe, NoiDung } = req.body;
    const isAdmin = req.session.QuyenHan === "admin";
    const chuong = await Chuong.findById(req.params.id);
    if (!chuong) return res.redirect("/error?message=Chương không tồn tại");

    const novelFilter = isAdmin
      ? { _id: MaTruyen, KiemDuyet: 1 }
      : { _id: MaTruyen, KiemDuyet: 1, TaiKhoan: req.session.MaNguoiDung };
    const selectedNovel = await Novel.findOne(novelFilter).select("_id").lean();
    if (!selectedNovel) {
      req.session.error = "Bạn chỉ có thể chuyển chương vào truyện đã duyệt thuộc quyền quản lý của bạn.";
      return res.redirect("/error");
    }

    chuong.Novel = MaTruyen;
    chuong.TieuDe = TieuDe;
    chuong.NoiDung = NoiDung;
    chuong.KiemDuyet = isAdmin ? 1 : 0;
    await chuong.save();

    if (!isAdmin) {
      // Sau khi tác giả chỉnh sửa gửi duyệt lại, các thông báo từ chối cũ được đánh dấu đã đọc.
      await ThongBao.updateMany(
        {
          NguoiNhan: req.session.MaNguoiDung,
          Loai: "chuong",
          MucTieuId: chuong._id,
          TrangThai: "rejected",
          DaDoc: 0,
        },
        { $set: { DaDoc: 1 } }
      );
    }

    req.session.success = isAdmin
      ? "Đã cập nhật chương thành công và hiển thị ngay."
      : "Đã cập nhật chương thành công và đang chờ admin kiểm duyệt lại.";
    if (isAdmin) {
      return res.redirect("/chuong");
    }
    return res.redirect("/chuong/cuatoi");
  } catch (error) {
    console.error(error);
    res.redirect("/error?message=Lỗi khi cập nhật chương");
  }
});

// POST: Xóa chương
router.post("/xoa/:id", requireLogin, requireChapterOwnerOrAdmin, async (req, res) => {
  try {
    await Chuong.findByIdAndDelete(req.params.id);
    if (req.session.QuyenHan === "admin") {
      return res.redirect("/chuong");
    }
    return res.redirect("/chuong/cuatoi");
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
router.post("/duyet/:id", isAdmin, async (req, res) => {
  try {
    const chuong = await Chuong.findById(req.params.id).populate("Novel", "TieuDe");
    if (!chuong) return res.redirect("/chuong?error=Không tìm thấy chương");

    const { action } = req.body;
    const lyDo = String(req.body.lyDo || "").trim();

    if (action === "approve") {
      chuong.KiemDuyet = 1;
    } else if (action === "reject") {
      chuong.KiemDuyet = 0;
    } else {
      return res.redirect("/chuong?error=Hành động không hợp lệ");
    }

    await chuong.save();

    await ThongBao.create({
      NguoiNhan: chuong.TaiKhoan,
      Loai: "chuong",
      MucTieuId: chuong._id,
      TieuDe: action === "approve" ? "Chương đã được duyệt" : "Chương chưa được duyệt",
      NoiDung:
        action === "approve"
          ? `Chương \"${chuong.TieuDe}\" của truyện \"${chuong.Novel ? chuong.Novel.TieuDe : "Không xác định"}\" đã được admin duyệt.`
          : `Chương \"${chuong.TieuDe}\" của truyện \"${chuong.Novel ? chuong.Novel.TieuDe : "Không xác định"}\" chưa được duyệt.${lyDo ? ` Lý do: ${lyDo}` : " Vui lòng kiểm tra và chỉnh sửa nội dung."}`,
      TrangThai: action === "approve" ? "approved" : "rejected",
    });

    res.redirect("/chuong");
  } catch (err) {
    console.error(err);
    res.redirect("/chuong?error=Có lỗi xảy ra khi duyệt chương");
  }
});

// Giữ tương thích ngược cho form/action cũ
router.post("/duyet-chuong/:id", isAdmin, async (req, res) => {
  return res.redirect(307, `/chuong/duyet/${req.params.id}`);
});

module.exports = router;
