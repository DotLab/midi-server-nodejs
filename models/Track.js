const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const {YES, NO} = require('../utils');

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
  mainColor: [{
    color1: String,
    color2: String,
  }],

  genre: String,
  tags: String,
  description: String,
  releaseDate: Date,
  duration: Number,
  likeCount: Number,
  commentCount: Number,
});
