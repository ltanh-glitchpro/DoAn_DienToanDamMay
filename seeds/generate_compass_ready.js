const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "compass_ready");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const PASSWORD_HASH = "$2b$10$uRfk3S/Q5ZEsZpeP2KKbrui1GHr8.5CgYBqbLYNOykbMsaJT2cSL6";

function oid(prefix, index) {
  const suffix = index.toString(16).padStart(24 - prefix.length, "0");
  return `${prefix}${suffix}`.slice(0, 24);
}

function wrapOid(value) {
  return { $oid: value };
}

function wrapDate(value) {
  return { $date: value.toISOString() };
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(outDir, fileName), JSON.stringify(data, null, 2), "utf8");
}

function pick(list, index) {
  return list[index % list.length];
}

const theLoaiNames = [
  "Tiên hiệp",
  "Huyền huyễn",
  "Đô thị",
  "Ngôn tình",
  "Trinh thám",
  "Mạt thế",
  "Khoa huyễn",
  "Kiếm hiệp"
];

const theloais = theLoaiNames.map((name, index) => ({
  _id: wrapOid(oid("66a100", index + 1)),
  tentheloai: name
}));

const theLoaiByName = Object.fromEntries(theloais.map((item) => [item.tentheloai, item]));

const userProfiles = [
  ["Lê Tuấn Anh", "admin", "admin@trangtruyenchu.vn", "admin", "1775576043926-569794817.jpg"],
  ["Nguyễn Minh Khang", "minhkhang", "minhkhang@gmail.com", "user", "1775576149877-81798662.jpg"],
  ["Trần Thu Hà", "thuha", "thuha@gmail.com", "user", "1775632509240-575826184.jpg"],
  ["Phạm Gia Huy", "giahuy", "giahuy@gmail.com", "user", "1775640274865-702183378.jpg"],
  ["Đặng Ngọc Lan", "ngoclan", "ngoclan@gmail.com", "user", "1775576043926-569794817.jpg"],
  ["Võ Quốc Thịnh", "quocthinh", "quocthinh@gmail.com", "user", "1775576149877-81798662.jpg"]
];

const taikhoans = userProfiles.map((user, index) => ({
  _id: wrapOid(oid("66a200", index + 1)),
  HoVaTen: user[0],
  Email: user[2],
  HinhAnh: user[4],
  TenDangNhap: user[1],
  MatKhau: PASSWORD_HASH,
  QuyenHan: user[3],
  KichHoat: 1
}));

const accountByIndex = taikhoans.map((item) => item);

const coverImages = [
  "/images/uploads/phamnhantu.jpg",
  "/images/uploads/daupha.jpg",
  "/images/uploads/vudong.jpg",
  "/images/uploads/toanchuc.jpg",
  "/images/uploads/dainietban.jpg",
  "/images/uploads/thonphe.jpg",
  "/images/uploads/119269410.jpeg",
  "/images/uploads/133886785.jpeg",
  "/images/uploads/448131569.jpeg",
  "/images/uploads/541808158.jpeg",
  "/images/uploads/803474892.png",
  "/images/uploads/828846920.jpeg"
];

const protagonistPool = [
  "Lục Trần",
  "An Nhiên",
  "Minh Khang",
  "Thu Hà",
  "Gia Huy",
  "Ngọc Lan",
  "Quang Minh",
  "Bảo Trân",
  "Hạ Vy",
  "Tấn Phong"
];

const settingPool = [
  "Lạc Vân Thành",
  "Quận 4",
  "khu tập thể An Bình",
  "trạm kiểm soát số 7",
  "Tửu quán ven sông",
  "bệnh viện Mây Trắng",
  "ga tàu cũ",
  "thư viện tỉnh",
  "chung cư 12B",
  "làng ven biển"
];

const motifs = {
  "Tiên hiệp": {
    role: "người giữ thư các",
    words: ["linh khí", "trận pháp", "đan điền", "kiếm ý", "sơn môn"],
    chapterTitles: ["Mở mạch", "Bước qua sơn môn", "Kiếm tâm thức tỉnh"]
  },
  "Huyền huyễn": {
    role: "người giữ khóa ký ức",
    words: ["ấn chú", "cánh cửa", "giấc mơ", "đèn dầu", "mảnh gương"],
    chapterTitles: ["Dấu ấn đầu tiên", "Hành lang trong mơ", "Cánh cửa ký ức"]
  },
  "Đô thị": {
    role: "biên tập viên ca tối",
    words: ["tin nhắn", "thang máy", "quán cà phê", "mưa đêm", "đường vành đai"],
    chapterTitles: ["Ca đêm đầu tiên", "Mưa trên ô kính", "Ngã rẽ cũ"]
  },
  "Ngôn tình": {
    role: "kiến trúc sư trẻ",
    words: ["lá thư", "ga tàu", "bản nhạc", "ô cửa áp mái", "mùa hạ"],
    chapterTitles: ["Một lần gặp lại", "Bản nhạc còn dang dở", "Ngày em quay về"]
  },
  "Trinh thám": {
    role: "điều tra viên hồ sơ",
    words: ["camera", "dấu giày", "lời khai", "mật mã", "hiện trường"],
    chapterTitles: ["Hiện trường im lặng", "Dấu giày trong hành lang", "Lời khai cuối cùng"]
  },
  "Mạt thế": {
    role: "người điều phối sơ tán",
    words: ["radio", "trạm điện", "cửa chắn", "tuyến sơ tán", "đèn báo đỏ"],
    chapterTitles: ["Đèn cảnh báo đỏ", "Tuyến sơ tán số 3", "Bình minh sau bức tường"]
  },
  "Khoa huyễn": {
    role: "kỹ sư tín hiệu", 
    words: ["tín hiệu", "quỹ đạo", "khoang dữ liệu", "bản ghi", "trung tâm điều khiển"],
    chapterTitles: ["Tín hiệu ngoài quỹ đạo", "Khoang dữ liệu bị khóa", "Đường truyền cuối"]
  },
  "Kiếm hiệp": {
    role: "lữ khách giang hồ",
    words: ["chuôi kiếm", "khách điếm", "bến đò", "đao phổ", "giang hồ"],
    chapterTitles: ["Đêm ở khách điếm", "Dấu kiếm bên bến đò", "Một chiêu giữa giang hồ"]
  }
};

const hookBanks = {
  "Tiên hiệp": [
    "một phong ấn cổ trong thư các của sơn môn bất ngờ nứt ra",
    "một thanh kiếm không tên rơi khỏi vách đá lúc nửa đêm",
    "một mảnh ngọc bội dẫn đường đến linh mạch bị quên lãng",
    "lệnh ấn của trưởng lão cũ bật sáng ngay trong tay cậu",
    "một trận pháp bị bỏ hoang vẫn còn chạy sau mười năm"
  ],
  "Huyền huyễn": [
    "cánh cửa sau căn gác trọ chỉ mở khi có sương",
    "những trang nhật ký tự viết lại vào lúc 3 giờ 7 phút",
    "một con sông đổi màu mỗi lần tên người mất tích bị nhắc tới",
    "một bức thư đến từ khu rừng mà bản đồ không còn ghi",
    "bóng đèn dầu trong hành lang thắp sáng một ký ức không thuộc về ai"
  ],
  "Đô thị": [
    "một cuộc gọi nhỡ từ số máy đã khóa suốt bảy năm",
    "hồ sơ thuê căn hộ chứa tên người sống cùng anh trước khi mất tích",
    "đường tàu điện ngầm dừng lại ở một ga không có trên sơ đồ",
    "mưa kéo dài ba ngày khiến cả khu phố phải sống chậm lại",
    "một bản hợp đồng cũ mở ra câu chuyện chưa kịp kết thúc"
  ],
  "Ngôn tình": [
    "một lá thư bị kẹp trong cuốn sổ tay ở ga cuối",
    "một bản nhạc cũ gợi lại lời hẹn chưa từng trọn",
    "một lần gặp lại ở con dốc dẫn lên đồi cỏ",
    "ô cửa áp mái nhìn xuống cả một thời thanh xuân",
    "mùa hè năm đó biến mất cùng một người chưa kịp nói lời tạm biệt"
  ],
  "Trinh thám": [
    "camera an ninh ghi được một chiếc bóng không có mặt người",
    "dấu giày ngoài hành lang không khớp với ai trong danh sách",
    "hồ sơ vụ án bị xé mất đúng trang có chữ ký",
    "một chiếc chuông cũ reo đúng lúc không ai chạm vào",
    "mật mã trong bức tường hành lang dẫn đến căn phòng khóa trái"
  ],
  "Mạt thế": [
    "đèn báo của trạm y tế tắt đúng vào giờ sơ tán",
    "thành phố mất điện trong đêm đầu tiên của mùa mưa",
    "khu chợ bỏ hoang vẫn còn phát ra tín hiệu radio",
    "dòng sông đổi màu sau sự cố ở nhà máy",
    "bức tường cách ly cuối cùng sắp bị thủng"
  ],
  "Khoa huyễn": [
    "tín hiệu ngoài quỹ đạo lặp lại cùng một chu kỳ bất thường",
    "hành tinh mưa đỏ phát ra chuỗi dữ liệu không giải mã",
    "sổ tay nhớ lại những ký ức không thuộc về người viết",
    "tàu đêm đi qua một vùng đất chưa từng có trên bản đồ",
    "bản ghi trung tâm báo lỗi ở mọi đường truyền cùng lúc"
  ],
  "Kiếm hiệp": [
    "một chuôi kiếm cũ được đặt trên bàn rượu thay cho tiền",
    "bến đò vắng người nhưng còn in dấu chân của một cao thủ",
    "đao phổ thất lạc quay về cùng một kẻ không muốn dính vào giang hồ",
    "khách điếm ven núi bỗng có thêm một phòng không ai mở được",
    "tiếng gió trên sườn núi mang theo tin về một cuộc đấu đã hẹn từ lâu"
  ]
};

const novelGroups = [
  {
    category: "Tiên hiệp",
    items: [
      "Phàm Nhân Tu Tiên",
      "Đấu Phá Thương Khung",
      "Võ Động Càn Khôn",
      "Kiếm Tâm Trấn Thư Các",
      "Vực Sáng Trên Đỉnh Mây"
    ]
  },
  {
    category: "Huyền huyễn",
    items: [
      "Toàn Chức Pháp Sư",
      "Nhật Ký Người Gác Đèn",
      "Hơi Thở Của Dòng Sông",
      "Bức Thư Từ Khu Rừng Cũ",
      "Khi Cánh Cửa Mở Trong Sương"
    ]
  },
  {
    category: "Đô thị",
    items: [
      "Căn Hộ Số 1209",
      "Mùa Mưa Ở An Nhiên",
      "Tháng Năm Ở Quận 4",
      "Đường Về Thành Phố Cũ",
      "Một Ngày Trên Tuyến Metro"
    ]
  },
  {
    category: "Ngôn tình",
    items: [
      "Đêm Ở Phố Gió",
      "Đồi Cỏ Và Những Lá Thư",
      "Con Đường Của Bản Tình Ca",
      "Định Mệnh Trên Tầng Áp Mái",
      "Mùa Hè Sau Cơn Mất Tích"
    ]
  },
  {
    category: "Trinh thám",
    items: [
      "Bóng Đêm Trên Phố Cũ",
      "Vụ Án Cây Cầu Sắt",
      "Tiếng Chuông Lúc 3 Giờ 7",
      "Người Đứng Sau Ô Cửa Sổ",
      "Mật Mã Trên Hành Lang"
    ]
  },
  {
    category: "Mạt thế",
    items: [
      "Thành Phố Không Đèn",
      "Ngày Cổng Bệnh Viện Đóng Lại",
      "Trạm Dừng Cuối Cùng",
      "Dòng Sông Không Trở Lại",
      "Đại Niết Bàn"
    ]
  },
  {
    category: "Khoa huyễn",
    items: [
      "Hành Tinh Mưa Đỏ",
      "Sổ Tay Của Người Thu Gom Ký Ức",
      "Vùng Đất Chưa Tên",
      "Tàu Đêm Đi Về Phía Nam",
      "Người Canh Giữ Tín Hiệu"
    ]
  },
  {
    category: "Kiếm hiệp",
    items: [
      "Kiếm Khách Cuối Bến Đò",
      "Lưỡi Kiếm Trên Tuyết Mỏng",
      "Mười Năm Ở Tửu Quán",
      "Mưa Trên Đường Đao Phổ",
      "Một Lần Ra Tay Ở Giang Hồ"
    ]
  }
];

function buildSummary(profile) {
  const motif = motifs[profile.category];
  return `${profile.title} theo chân ${profile.protagonist}, một ${motif.role} ở ${profile.setting}, khi ${profile.hook} làm thay đổi nhịp sống vốn quen thuộc. Câu chuyện đi từ những chi tiết đời thường sang một chuỗi lựa chọn buộc nhân vật phải đối diện với ký ức, trách nhiệm và lời hứa còn dang dở.`;
}

function buildChapterContent(profile, chapterNumber) {
  const motif = motifs[profile.category];
  const words = motif.words;
  const chapterTitles = motif.chapterTitles;
  const opening = {
    1: [
      `${profile.protagonist} vẫn nghĩ buổi sáng ở ${profile.setting} sẽ trôi đi như bao ngày khác, cho tới khi ${profile.hook}.`,
      `Từ khoảnh khắc ấy, ${profile.title} bắt đầu mở ra một nhịp kể chậm và chắc, để người đọc nhìn thấy điều gì đang bị che khuất ngay dưới bề mặt yên ả.`,
      `Chi tiết đầu tiên liên quan đến ${words[0]} xuất hiện rất khẽ, nhưng đủ làm thay đổi cách ${profile.protagonist} nhìn vào mọi thứ quanh mình.`
    ],
    2: [
      `Sau biến cố đầu, ${profile.protagonist} buộc phải đi sâu hơn vào những gì đã bị giấu kín ở ${profile.setting}.`,
      `Một dấu vết liên quan đến ${words[1]} xuất hiện đúng lúc mọi câu trả lời cũ bắt đầu tỏ ra không còn đáng tin.`,
      `Không ai trong khu vực muốn nói nhiều, nhưng từng mảnh thông tin rời rạc lại ghép thành một bức tranh khó bỏ qua.`
    ],
    3: [
      `Nhịp truyện ở ${profile.title} dồn lại khi ${profile.protagonist} chạm gần hơn đến sự thật nằm sau ${words[2]}.`,
      `Mọi thứ trước đó dường như chỉ là phần nổi của một cấu trúc lớn hơn, nơi ${words[3]} và ${words[4]} cùng tồn tại trong thế cân bằng mong manh.`,
      `Chương này khép lại bằng một lựa chọn rõ ràng: hoặc tiếp tục bước tới, hoặc để bí mật ấy ngủ yên thêm một lần nữa.`
    ]
  };

  return [
    ...opening[chapterNumber],
    `Ở đây, không khí của ${profile.setting} được giữ đủ lâu để người đọc cảm thấy từng thay đổi nhỏ nhất trong tâm lý nhân vật.`,
    `Sự xuất hiện của ${words[chapterNumber - 1]} là nút thắt để đẩy câu chuyện sang lớp nghĩa tiếp theo, thay vì chỉ dừng lại ở một mô-típ quen thuộc.`,
    `Cuối chương, ${profile.protagonist} hiểu rằng điều mình đang tìm không chỉ là đáp án, mà còn là cách sống tiếp sau khi sự thật được gọi tên.`
  ].join("\n\n");
}

const novels = [];
const chuongs = [];
const baseDate = new Date("2026-04-08T08:00:00.000Z");

let novelCounter = 0;

for (const group of novelGroups) {
  group.items.forEach((title, groupIndex) => {
    novelCounter += 1;
    const novelId = oid("66a300", novelCounter);
    const author = accountByIndex[(novelCounter - 1) % accountByIndex.length];
    const protagonist = pick(protagonistPool, novelCounter - 1);
    const setting = pick(settingPool, novelCounter - 1);
    const hook = pick(hookBanks[group.category], groupIndex);
    const cover = pick(coverImages, novelCounter - 1);
    const publishedAt = new Date(baseDate.getTime() - novelCounter * 42 * 60 * 60 * 1000);

    const profile = {
      _id: wrapOid(novelId),
      TheLoai: wrapOid(theLoaiByName[group.category]._id.$oid),
      TaiKhoan: wrapOid(author._id.$oid),
      TieuDe: title,
      TomTat: buildSummary({ title, category: group.category, protagonist, setting, hook }),
      SoChuong: 3,
      TrangThai: novelCounter <= 12 ? 1 : 0,
      HinhAnh: cover,
      NgayDang: wrapDate(publishedAt),
      LuotXem: 1800 + (novelGroups.length * 5 - novelCounter) * 173,
      KiemDuyet: 1
    };

    novels.push(profile);

    for (let chapterNumber = 1; chapterNumber <= 3; chapterNumber += 1) {
      const chapterIndex = (novelCounter - 1) * 3 + chapterNumber;
      const chapterId = oid("66a400", chapterIndex);
      const chapterDate = new Date(publishedAt.getTime() + chapterNumber * 35 * 60 * 1000);

      chuongs.push({
        _id: wrapOid(chapterId),
        Novel: wrapOid(novelId),
        TaiKhoan: wrapOid(author._id.$oid),
        TieuDe: `Chương ${chapterNumber}: ${motifs[group.category].chapterTitles[chapterNumber - 1]}`,
        NoiDung: buildChapterContent({ title, category: group.category, protagonist, setting, hook }, chapterNumber),
        NgayDang: wrapDate(chapterDate),
        KiemDuyet: 1
      });
    }
  });
}

writeJson("theloais.json", theloais);
writeJson("taikhoans.json", taikhoans);
writeJson("novels.json", novels);
writeJson("chuongs.json", chuongs);

console.log(`Generated ${theloais.length} categories, ${taikhoans.length} users, ${novels.length} novels, ${chuongs.length} chapters.`);