var mongoose = require('mongoose');

const novelSchema = new mongoose.Schema({
	TheLoai: { type: mongoose.Schema.Types.ObjectId, ref: 'TheLoai' },
	TaiKhoan: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' },
	TieuDe: { type: String, required: true },
	TomTat: { type: String, required: true },
	SoChuong: { type: Number, default: 0 },
	TrangThai: { type: Number, default: 0 },
	HinhAnh: { type: String, required: true },
	NgayDang: { type: Date, default: Date.now },
	LuotXem: { type: Number, default: 0 },
	KiemDuyet: { type: Number, default: 0 }
});

var novelModel = mongoose.model('Novel', novelSchema);

module.exports = novelModel;