const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Comment', {
  targetId: ObjectId,
  targetAuthorId: ObjectId,
  commentAuthorId: ObjectId,
  commentAuthorName: String,
  commentAuthorAvatarUrl: String,
  body: String,
  date: Date,
});
