const User = require('../models/User');
const Track = require('../models/Track');
const Album = require('../models/Album');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {BAD_REQUEST, calcFileHash} = require('./utils');
const sharp = require('sharp');
const Vibrant = require('node-vibrant');
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

exports.coverUpload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);

  const hash = calcFileHash(params.buffer);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/midi/imgs/${hash}.jpg`;
  const localPath = `${tempPath}/${hash}.jpg`;
  const buf = Buffer.from(params.buffer, 'base64');

  const url = server.bucketGetPublicUrl(remotePath);
  await sharp(buf).resize(256, 256).jpeg({quality: 80}).toFile(localPath);
  await server.bucketUploadPublic(localPath, remotePath);
  fs.unlink(localPath, () => { });

  return apiSuccess(url);
};

exports.upload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  const trackIds = [];
  const colors = [];
  await Vibrant.from(params.coverUrl).getPalette()
      .then((palette) => {
        colors.push(palette.DarkMuted.getRgb());
        colors.push(palette.Vibrant.getRgb());
        colors.push(palette.LightVibrant.getRgb());
      });

  console.log(colors);

  for (let i = 0; i < params.buffers.length; i++) {
    const hash = calcFileHash(params.buffers[i]);
    if (!hash) {
      return apiError(BAD_REQUEST);
    }

    const remotePath = `/midi/${hash}.mid`;
    const localPath = `${tempPath}/${hash}.mid`;

    const url = server.bucketGetPublicUrl(remotePath);

    fs.writeFileSync(localPath, params.buffers[i], 'base64');
    await server.bucketUploadPublic(localPath, remotePath);
    fs.unlink(localPath, () => { });

    const track = await Track.create({
      artistId: userId,
      artistName: userName.userName,
      fileName: params.fileNames[i],
      fileSize: params.fileSizes[i],
      hash: hash,
      path: remotePath,
      coverUrl: params.coverUrl,
      trackUrl: url,
      colors: colors,

      genre: params.genre,
      tags: params.tags,
      description: params.description,
      releaseDate: new Date(),
      likeCount: 0,
      commentCount: 0,
    });

    trackIds.push(track.id);
  }

  if (params.buffers.length > 1) {
    const album = await Album.create({
      artistId: userId,
      artistName: userName.userName,
      coverUrl: params.coverUrl,
      colors: colors,
      tags: params.tags,
      description: params.description,
      releaseDate: new Date(),
      trackCount: params.fileNames.length,
      likeCount: 0,
      commentCount: 0,
    });

    await Promise.all(trackIds.map((id) => {
      Track.findByIdAndUpdate(id, {
        $set: {albumId: album.id},
      });
    }));
    return apiSuccess(album.id);
  } else {
    return apiSuccess(trackIds[0]);
  }
};
