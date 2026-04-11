var express = require('express');
var router = express.Router();
var ThongBao = require('../models/thongbao');

function requireLogin(req, res, next) {
  if (req.session && req.session.MaNguoiDung) {
    return next();
  }
  req.session.error = 'Bạn cần đăng nhập để tiếp tục.';
  return res.redirect('/auth/dangnhap');
}

router.get('/cuatoi', requireLogin, async function (req, res) {
  try {
    var page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    var perPage = 12;
    var filter = { NguoiNhan: req.session.MaNguoiDung };

    var total = await ThongBao.countDocuments(filter);
    var totalPages = Math.max(1, Math.ceil(total / perPage));
    var safePage = Math.min(page, totalPages);
    var skip = (safePage - 1) * perPage;

    var danhSach = await ThongBao.find(filter)
      .sort({ NgayTao: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    res.render('thongbao', {
      title: 'Thông báo của tôi',
      thongbaos: danhSach,
      page: safePage,
      totalPages: totalPages
    });
  } catch (error) {
    console.error(error);
    req.session.error = 'Không thể tải danh sách thông báo.';
    return res.redirect('/error');
  }
});

router.get('/chuyen/:id', requireLogin, async function (req, res) {
  try {
    var thongBao = await ThongBao.findOne({
      _id: req.params.id,
      NguoiNhan: req.session.MaNguoiDung
    }).lean();

    if (!thongBao) {
      req.session.error = 'Thông báo không tồn tại hoặc bạn không có quyền truy cập.';
      return res.redirect('/error');
    }

    if (thongBao.Loai === 'novel') {
      return res.redirect('/novel/chitiet/' + thongBao.MucTieuId);
    }

    return res.redirect('/chuong/sua/' + thongBao.MucTieuId);
  } catch (error) {
    console.error(error);
    req.session.error = 'Không thể mở thông báo.';
    return res.redirect('/error');
  }
});

router.post('/dadoc/:id', requireLogin, async function (req, res) {
  try {
    await ThongBao.updateOne(
      { _id: req.params.id, NguoiNhan: req.session.MaNguoiDung },
      { $set: { DaDoc: 1 } }
    );
    return res.redirect('back');
  } catch (error) {
    console.error(error);
    req.session.error = 'Không thể cập nhật thông báo.';
    return res.redirect('/error');
  }
});

router.post('/dadoc-tatca', requireLogin, async function (req, res) {
  try {
    await ThongBao.updateMany(
      { NguoiNhan: req.session.MaNguoiDung, DaDoc: 0 },
      { $set: { DaDoc: 1 } }
    );
    req.session.success = 'Đã đánh dấu tất cả thông báo là đã đọc.';
    return res.redirect('/thongbao/cuatoi');
  } catch (error) {
    console.error(error);
    req.session.error = 'Không thể cập nhật thông báo.';
    return res.redirect('/error');
  }
});

module.exports = router;
