const User = require('../models/User');
const Track = require('../models/Track');
const Album = require('../models/Album');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {BAD_REQUEST, calcFileHash} = require('./utils');
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');

const tempPath = './temp';
const fs = require('fs');
const path = require('path');
if (fs.existsSync(tempPath)) {
  const files = fs.readdirSync(tempPath);
  for (const file of files) {
    fs.unlinkSync(path.join(tempPath, file));
  }
} else {
  fs.mkdirSync(tempPath);
}

exports.upload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);

  const trackUrls = [];
  for (let i = 0; i < params.buffer.length; i++) {
    const hash = calcFileHash(params.buffer[i]);
    if (!hash) {
      return apiError(BAD_REQUEST);
    }

    const remotePath = `/imgs/${hash}.jpg`;
    const localPath = `${tempPath}/${hash}.jpg`;

    const url = server.bucketGetPublicUrl(remotePath);
    trackUrls.push(url);

    fs.writeFileSync(localPath, params.buffer[i], 'base64');
    await server.bucketUploadPublic(localPath, remotePath);
    fs.unlink(localPath, () => {});
  }

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const track = await Track.create({

  });
  
  const album = Album.find({albumId: params.albumId}).countDocuments();
  if (album === 0) {
    return apiSuccess(track.id);
  }

  await Album.findByIdAndUpdate(params.albumId, {
    $inc: {trackCount: 1},
  });

  return apiSuccess(track.id);
};
