const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Album', {
  artistId: ObjectId,
  artistName: String,

  coverUrl: String,
  colors: Array,

  tags: String,
  description: String,
  releaseDate: Date,
  trackCount: Number,
  likeCount: Number,
  commentCount: Number,
});
