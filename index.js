require("dotenv").config();

var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var session = require("express-session");
var MongoStore = require("connect-mongo");
var path = require("path");
var TheLoai = require("./models/theloai");
var Novel = require("./models/novel");
var Chuong = require("./models/chuong");
var resolveImageUrl = require("./modules/resolveImageUrl");

var indexRouter = require("./routers/index");
var authRouter = require("./routers/auth");
var theloaiRouter = require("./routers/theloai");
var taikhoanRouter = require("./routers/taikhoan");
var novelRouter = require("./routers/novel");
var chuongRouter = require("./routers/chuong");

var uri = 'mongodb://admin:admin123@ac-exoafeo-shard-00-02.dmubves.mongodb.net:27017/trangtruyenchu?ssl=true&authSource=admin';
const port = process.env.PORT || 3000;

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

app.use(
  session({
    name: "iNews",
    secret: "Black cat eat black mouse",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      ttl: 30 * 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: false,
    },
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.resolveImageUrl = resolveImageUrl;
  var error = req.session.error;
  var success = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.errorMsg = error || "";
  res.locals.successMsg = success || "";
  next();
});

app.use(async (req, res, next) => {
  try {
    const navTheLoai = await TheLoai.find({}, { tentheloai: 1 })
      .sort({ tentheloai: 1 })
      .lean();

    const navNovels = await Novel.find({ KiemDuyet: 1 }, { TieuDe: 1 })
      .sort({ NgayDang: -1 })
      .limit(12)
      .lean();

    let pendingNovelCount = 0;
    let pendingChuongCount = 0;

    if (req.session && req.session.QuyenHan === "admin") {
      const counts = await Promise.all([
        Novel.countDocuments({ KiemDuyet: 0 }),
        Chuong.countDocuments({ KiemDuyet: 0 }),
      ]);
      pendingNovelCount = counts[0];
      pendingChuongCount = counts[1];
    }

    const segmentLabelMap = {
      auth: "Tài khoản",
      dangnhap: "Đăng nhập",
      dangky: "Đăng ký",
      dangxuat: "Đăng xuất",
      theloai: "Thể loại",
      taikhoan: "Tài khoản",
      novel: "Truyện",
      chuong: "Chương",
      chitiet: "Chi tiết",
      timkiem: "Tìm kiếm",
      tinmoinhat: "Tin mới nhất",
      loc: "Lọc truyện",
      them: "Thêm mới",
      them_admin: "Thêm tài khoản",
      sua: "Chỉnh sửa",
      cuatoi: "Của tôi",
      hoso: "Hồ sơ",
      duyet: "Duyệt"
    };

    const pathParts = req.path.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Trang chủ", url: "/" }];
    let currentPath = "";

    pathParts.forEach((part, idx) => {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(part);
      if (isObjectId) {
        return;
      }

      currentPath += `/${part}`;
      const fallbackLabel = part.charAt(0).toUpperCase() + part.slice(1);
      const label = segmentLabelMap[part.toLowerCase()] || fallbackLabel;

      breadcrumbs.push({
        label,
        url: idx === pathParts.length - 1 ? null : currentPath
      });
    });

    res.locals.navTheLoai = navTheLoai;
    res.locals.navNovels = navNovels;
    res.locals.breadcrumbs = breadcrumbs;
    res.locals.pendingNovelCount = pendingNovelCount;
    res.locals.pendingChuongCount = pendingChuongCount;
    res.locals.pendingReviewCount = pendingNovelCount + pendingChuongCount;
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/", authRouter);
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/theloai", theloaiRouter); 
app.use("/taikhoan", taikhoanRouter);
app.use("/novel", novelRouter);
app.use("/chuong", chuongRouter);

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected successfully, starting server...");
    // Thêm "0.0.0.0" vào đây để Render cho phép truy cập từ bên ngoài
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
