const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  userName: String,
  displayName: String,
  email: String,

  passwordSalt: String,
  passwordSha256: String,

  overview: String,
  avatarUrl: String,

  followingCount: Number,
  followerCount: Number,
  trackCount: Number,
  albumCount: Number,
});
