const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const {YES, NO} = require('../utils');

module.exports = mongoose.model('Album', {
  artistId: ObjectId,
  artistName: String,

  fileName: String,
  fileSize: Number,
  hash: String,
  path: String,
  coverUrl: String,
  trackUrls: [String],
  mainColor: [{
    color1: String,
    color2: String,
  }],

  tags: String,
  description: String,
  releaseDate: Date,
  duration: Number,
  trackCount: Number,
  likeCount: Number,
  commentCount: Number,
});
