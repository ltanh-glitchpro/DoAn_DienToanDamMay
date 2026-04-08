var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var firstImage = require('../modules/firstimage');
var TheLoai = require('../models/theloai');
var Novel = require('../models/novel');
var Chuong = require('../models/chuong');

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET: Trang chủ
router.get('/', async (req, res) => {
    var tl = await TheLoai.find();

    var novelPerPage = 12;
    var requestedNovelPage = parseInt(req.query.page, 10) || 1;
    var novelTotal = await Novel.countDocuments({ KiemDuyet: 1 });
    var novelTotalPages = Math.max(1, Math.ceil(novelTotal / novelPerPage));
    var novelPage = Math.min(Math.max(requestedNovelPage, 1), novelTotalPages);
    var novelSkip = (novelPage - 1) * novelPerPage;

    var tr = await Novel.find({KiemDuyet:1})
        .populate('TheLoai')
        .populate('TaiKhoan')
        .sort({NgayDang:'desc'})
        .skip(novelSkip)
        .limit(novelPerPage)
        .exec();

    var topPerPage = 6;
    var requestedPage = parseInt(req.query.topPage, 10) || 1;
    var topTotal = await Novel.countDocuments({ KiemDuyet: 1 });
    var topTotalPages = Math.max(1, Math.ceil(topTotal / topPerPage));
    var topPage = Math.min(Math.max(requestedPage, 1), topTotalPages);
    var topSkip = (topPage - 1) * topPerPage;

    var topDeCu = await Novel.find({ KiemDuyet: 1 })
        .populate('TheLoai')
        .sort({ LuotXem: -1, NgayDang: -1 })
        .skip(topSkip)
        .limit(topPerPage)
        .lean();

    var latestUpdates = await Chuong.find({ KiemDuyet: 1 })
        .populate({
            path: 'Novel',
            populate: [
                { path: 'TheLoai' },
                { path: 'TaiKhoan', select: 'HoVaTen' }
            ]
        })
        .populate({ path: 'TaiKhoan', select: 'HoVaTen' })
        .sort({ NgayDang: -1 })
        .limit(8)
        .lean();

    var completedNovels = await Novel.find({
        KiemDuyet: 1,
        TrangThai: 1
    })
        .populate('TheLoai')
        .populate('TaiKhoan')
        .sort({ SoChuong: -1, LuotXem: -1, NgayDang: -1 })
        .limit(12)
        .lean();

	res.render('home',{
		title:'Trang chủ',
		theloai: tl,
		novel: tr,
    novelPage: novelPage,
    novelTotalPages: novelTotalPages,
        firstImage: firstImage,
        topDeCu: topDeCu,
        topPage: topPage,
        topTotalPages: topTotalPages,
        topStartIndex: topSkip,
        latestUpdates: latestUpdates,
        completedNovels: completedNovels
	});
});

// GET: Lọc
router.get('/loc/:id', async (req, res) => {
    try {
        // 1. Cắt khoảng trắng thừa (nếu có)
        var id = req.params.id.trim(); 
        
        // 2. Ép kiểu rõ ràng về ObjectId để MongoDB hiểu
        // (Trong file index.js của bạn đã có require('mongoose') ở đầu file rồi)
        var objectId = new mongoose.Types.ObjectId(id);

        var tl = await TheLoai.find();
        
        // In ra console để kiểm tra
        console.log("--- DEBUG LỌC TRUYỆN ---");
        console.log("ID nhận từ URL:", id);
        
        // 3. Tìm kiếm bằng objectId
        var tr = await Novel.find({ KiemDuyet: 1, TheLoai: objectId })
            .populate('TheLoai')
            .populate('TaiKhoan')
            .sort({ NgayDang: 'desc' })
            .exec();

        console.log("Số lượng truyện tìm thấy:", tr.length);
        console.log("------------------------");

        res.render('loc', {
            title: 'Các truyện cùng thể loại',
            theloai: tl,
            novel: tr,
            firstImage: firstImage
        });
    } catch (error) {
        console.error("Lỗi trang lọc:", error);
        res.redirect('/error');
    }
});


router.get('/novel/chitiet/:id', async function(req, res){
    var id = req.params.id;
    var chaptersPerPage = 50;
    var requestedChapterPage = parseInt(req.query.chapPage, 10) || 1;

    // Tránh lỗi CastError khi URL truyền id không hợp lệ (ví dụ: tên file ảnh).
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.session.error = 'ID truyện không hợp lệ.';
        return res.redirect('/error');
    }

    if (!req.session.viewedNovels) {
        req.session.viewedNovels = [];
    }

    // Nếu chưa xem truyện này thì tăng lượt xem
    if (!req.session.viewedNovels.includes(id)) {
        await Novel.updateOne({ _id: id }, { $inc: { LuotXem: 1 } });
        req.session.viewedNovels.push(id);
    }

    var tr = await Novel.findById(id)
        .populate('TheLoai')
        .populate('TaiKhoan')
        .exec();

    if (!tr) {
        req.session.error = 'Không tìm thấy truyện.';
        return res.redirect('/error');
    }

    var approvedChapterCount = await Chuong.countDocuments({ Novel: id, KiemDuyet: 1 });
    var chapterTotalPages = Math.max(1, Math.ceil(approvedChapterCount / chaptersPerPage));
    var chapterPage = Math.min(Math.max(requestedChapterPage, 1), chapterTotalPages);
    var chapterSkip = (chapterPage - 1) * chaptersPerPage;

    var ch = await Chuong.find({ Novel: id, KiemDuyet: 1 })
        .sort({ createdAt: 1 })
        .skip(chapterSkip)
        .limit(chaptersPerPage)
        .lean();

    res.render('novel_chitiet',{
        novel: tr,
        chuong: ch,
        chapterPage: chapterPage,
        chapterTotalPages: chapterTotalPages,
        chapterStartIndex: chapterSkip,
        chapterTotalCount: approvedChapterCount
    });
});

// GET: Xem chuong
router.get('/chuong/chitiet/:id', async function(req, res){
	var id = req.params.id;
	var ch = await Chuong.findById(id)
		.populate('Novel')
		.populate('TaiKhoan').exec();
	var prevChapter = await Chuong.findOne({ Novel: ch.Novel, _id: { $lt: ch._id }, KiemDuyet: 1 })
		.sort({ _id: -1 })
		.exec();
	var nextChapter = await Chuong.findOne({ Novel: ch.Novel, _id: { $gt: ch._id },KiemDuyet: 1 })
		.sort({ _id: 1 })
		.exec();
	var allChapters = await Chuong.find({ Novel: ch.Novel,KiemDuyet: 1 })
		.sort({ _id: 1 })
		.exec();
	res.render('chuong_chitiet',{
		chuong:ch,
		prevChap:prevChapter,
		nextChap:nextChapter,
		allChap:allChapters
	});
});

    // GET: Goi y tim kiem theo tung ky tu
    router.get('/timkiem-goiy', async function(req, res) {
        try {
            var tukhoa = (req.query.tukhoa || '').trim();

            if (!tukhoa) {
                return res.json([]);
            }

            var regex = new RegExp(escapeRegex(tukhoa), 'i');

            var goiY = await Novel.find(
                {
                    KiemDuyet: 1,
                    TieuDe: { $regex: regex }
                },
                { TieuDe: 1, HinhAnh: 1 }
            )
                .sort({ LuotXem: -1, NgayDang: -1 })
                .limit(8)
                .lean();

            return res.json(goiY);
        } catch (error) {
            console.error('Loi goi y tim kiem:', error);
            return res.status(500).json([]);
        }
    });

// GET: Kết quả tìm kiếm
router.get('/timkiem', async function(req, res){
    var tukhoa = req.query.tukhoa;

    if(!tukhoa || tukhoa.trim() === '') {
        // Nếu không có từ khóa hoặc chuỗi trắng thì chuyển về trang chủ
        return res.redirect('/');
    }

    var dsTheLoai = await TheLoai.find();
    var ketqua = await Novel.find({
        KiemDuyet: 1,
        TieuDe: { $regex: new RegExp(tukhoa, 'i') }
    })
    .populate('TheLoai')
    .populate('TaiKhoan')
    .sort({ NgayDang: 'desc' })
    .exec();

    res.render('timkiem', {
        title: 'Kết quả tìm kiếm',
        truyens: ketqua,
        theloai: dsTheLoai
    });
});

router.get('/tinmoinhat', async function(req, res) {
    var topNovels = await Novel.find({ KiemDuyet: 1 })
        .populate('TheLoai')
        .sort({ LuotXem: -1 })
        .limit(10)
        .exec();

    var theloai = await TheLoai.find();

    res.render('tinmoinhat', {
        title: 'Tin mới nhất',
        topNovels: topNovels,
        theloai: theloai
    });
});



// GET: Lỗi
router.get('/error', async (req, res) => {
	res.render('error', {
		title: 'Lỗi'
	});
});

// GET: Thành công
router.get('/success', async (req, res) => {
	res.render('success', {
		title: 'Hoàn thành'
	});
});

module.exports = router;