var mongoose = require('mongoose');

var thongBaoSchema = new mongoose.Schema({
  NguoiNhan: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  Loai: { type: String, enum: ['novel', 'chuong'], required: true },
  MucTieuId: { type: mongoose.Schema.Types.ObjectId, required: true },
  TieuDe: { type: String, required: true },
  NoiDung: { type: String, required: true },
  TrangThai: { type: String, enum: ['approved', 'rejected'], required: true },
  DaDoc: { type: Number, default: 0 },
  NgayTao: { type: Date, default: Date.now }
});

thongBaoSchema.index({ NguoiNhan: 1, DaDoc: 1, NgayTao: -1 });

var thongBaoModel = mongoose.model('ThongBao', thongBaoSchema);

module.exports = thongBaoModel;
