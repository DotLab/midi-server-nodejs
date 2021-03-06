const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Track', {
  artistId: ObjectId,
  artistName: String,
  albumId: ObjectId,

  fileName: String,
  fileSize: Number,
  hash: String,
  path: String,
  coverUrl: String,
  trackUrl: String,
  colors: Array,

  genre: String,
  tags: String,
  description: String,
  releaseDate: Date,
  likeCount: Number,
  commentCount: Number,
});
