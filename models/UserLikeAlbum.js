const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('UserLikeAlbum', {
  userId: ObjectId,
  albumId: ObjectId,
});
