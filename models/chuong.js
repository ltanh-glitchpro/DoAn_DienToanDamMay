var mongoose = require('mongoose');

const chuongSchema = new mongoose.Schema({
	Novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel' },
	TaiKhoan: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' },
	TieuDe: { type: String, required: true },
	NoiDung: { type: String, required: true },
	NgayDang: { type: Date, default: Date.now },
	KiemDuyet: { type: Number, default: 0 }
});

var chuongModel = mongoose.model('Chuong', chuongSchema);

module.exports = chuongModel;