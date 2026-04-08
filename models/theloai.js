var mongoose = require('mongoose');

const theLoaiSchema = new mongoose.Schema({
	tentheloai: { type: String, required: true  }
});

var theLoaiModel = mongoose.model('TheLoai', theLoaiSchema);

module.exports = theLoaiModel;