const User = require('../models/User');
const Track = require('../models/Track');
const Album = require('../models/Album');
const Comment = require('../models/Comment');
const UserLikeTrack = require('../models/UserLikeTrack');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {BAD_REQUEST, NOT_FOUND, FORBIDDEN, calcFileHash, ALBUM} = require('./utils');
const sharp = require('sharp');
const Vibrant = require('node-vibrant');
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

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
  await sharp(buf).resize(380, 380).jpeg({quality: 80}).toFile(localPath);
  await server.bucketUploadPublic(localPath, remotePath);
  fs.unlink(localPath, () => { });

  return apiSuccess(url);
};

exports.upload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const userId = tokenService.getUserId(params.token);
  const user = await User.findOne({_id: userId}).select('userName avatarUrl');

  if (params.albumTitle) {
    const count = await Album.find({title: params.albumTitle}).countDocuments();
    if (count !== 0) {
      return apiError(BAD_REQUEST);
    }
  }

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
    const mp3RemotePath = `/midi/${hash}.mp3`;
    const localPath = `${tempPath}/${hash}.mid`;
    const mp3LocalPath = `${tempPath}/${hash}.mp3`;

    const url = server.bucketGetPublicUrl(mp3RemotePath);

    fs.writeFileSync(localPath, params.buffers[i], 'base64');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    try {
      await exec(`timidity ${localPath} -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k ${mp3LocalPath}`);
    } catch (err) {
      console.error(err);
    }

    // exec(`timidity ${localPath} -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k ${mp3LocalPath}`);
    // console.log(params.buffers[i]);
    // fs.writeFileSync(localPath, params.buffers[i]);
    await server.bucketUploadPublic(localPath, remotePath);
    fs.unlink(localPath, () => { });

    await server.bucketUploadPublic(mp3LocalPath, mp3RemotePath);
    fs.unlink(mp3LocalPath, () => { });

    const track = await Track.create({
      artistId: userId,
      artistName: user.userName,

      fileName: params.fileNames[i],
      fileSize: params.fileSizes[i],
      hash: hash,
      path: remotePath,
      coverUrl: params.coverUrl,
      trackUrl: url,
      colors: colors,

      title: params.title,
      genre: params.genre,
      tags: params.tags,
      description: params.description,
      releaseDate: new Date(),
      likeCount: 0,
      playCount: 0,
      commentCount: 0,
    });

    trackIds.push(track.id);
  }

  User.findByIdAndUpdate(userId, {
    $inc: {trackCount: params.buffers.length},
  }).exec();

  if (params.type === ALBUM) {
    const album = await Album.create({
      artistId: userId,
      artistName: user.userName,

      coverUrl: params.coverUrl,
      colors: colors,

      title: params.albumTitle,
      tags: params.tags,
      description: params.description,
      releaseDate: new Date(),
      trackCount: params.fileNames.length,
      likeCount: 0,
      commentCount: 0,
    });

    User.findByIdAndUpdate(userId, {
      $inc: {albumCount: 1},
    }).exec();

    console.log(trackIds[0]);
    await Track.findByIdAndUpdate(trackIds[0], {
      $set: {albumId: album.id},
    });

    return apiSuccess(album.id);
  } else {
    return apiSuccess(trackIds[0]);
  }
};

exports.detail = async function(params) {
  const track = await Track.findById(params.trackId);
  if (!track) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(track);
};


exports.createComment = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const user = await User.findOne({_id: userId}).select('userName avatarUrl');
  const track = await Track.findById(params.trackId);
  if (!track) {
    return apiError(NOT_FOUND);
  }

  await Comment.create({
    targetId: params.trackId,
    targetAuthorId: track.artistId,
    commentAuthorId: userId,
    commentAuthorName: user.userName,
    commentAuthorAvatarUrl: user.avatarUrl,
    body: params.comment,
    date: new Date(),
    timestamp: params.timestamp,
  });

  Track.findByIdAndUpdate(params.trackId, {
    $inc: {commentCount: 1},
  }).exec();

  return apiSuccess();
};

exports.deleteComment = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const comment = await Comment.findById(params.commentId);

  if (!comment) {
    return apiError(NOT_FOUND);
  }
  if (userId !== comment.commentAuthorId.toString() && userId !== comment.targetAuthorId.toString()) {
    return apiError(FORBIDDEN);
  }

  await Promise.all([
    Track.findByIdAndUpdate(comment.targetId, {
      $inc: {commentCount: -1},
    }),
    Comment.findByIdAndRemove(params.commentId),
  ]);

  return apiSuccess();
};

exports.commentList = async function(params) {
  const count = await Track.find({_id: params.trackId}).countDocuments();
  if (count === 0) {
    return apiError(BAD_REQUEST);
  }

  const comments = await Comment.find({targetId: params.trackId}).sort({date: -1}).limit(params.limit).lean().exec();
  const userId = tokenService.getUserId(params.token);

  comments.forEach((comment) => {
    comment.isOwner = (comment.targetAuthorId == userId || comment.commentAuthorId == userId) ? true : false;
  });

  return apiSuccess(comments);
};

exports.inAlbum = async function(params) {
  const track = await Track.findById(params.trackId).select('albumId');
  if (!track) {
    return apiError(NOT_FOUND);
  }
  if (!track.albumId) {
    return apiSuccess();
  }

  const album = await Album.findById(track.albumId);
  return apiSuccess(album);
};

exports.relatedTracks = async function(params) {
  const track = await Track.findById(params.trackId).select('albumId artistId');
  if (!track) {
    return apiError(NOT_FOUND);
  }
  if (!track.albumId) {
    const tracks = await Track.find({
      $and: [{artistId: track.artistId}, {_id: {$ne: track._id}}],
    }).exec();
    return apiSuccess(tracks);
  }

  const tracks = await Track.find({
    $and: [
      {$or: [{albumId: track.albumId}, {artistId: track.artistId}]},
      {_id: {$ne: track._id}},
    ],
  }).exec();
  console.log(tracks, 'here');
  return apiSuccess(tracks);
};

exports.getSignedUrl = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const track = await Track.findById(params.trackId);
  if (!track) {
    return apiError(NOT_FOUND);
  }

  const url = await server.generateSignedUrl('/midi/' + track.hash + '.mp3');

  return apiSuccess(url);
};

exports.download = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);
  const track = await Track.findById(params.trackId);
  if (!track) {
    return apiError(NOT_FOUND);
  }
  await server.downloadFile(track.fileName, '/midi/' + track.hash + '.mp3');
  console.log('/midi/' + track.hash + '.mp3');
  return apiSuccess();
};


exports.like = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const trackCount = await Track.find({_id: params.trackId}).countDocuments();
  if (trackCount === 0) {
    return apiError(NOT_FOUND);
  }
  const existingCount = await UserLikeTrack.find({userId: userId, trackId: params.trackId}).countDocuments();
  if (existingCount > 0) {
    // The user already liked trackId
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    UserLikeTrack.create({
      userId: userId,
      trackId: params.trackId,
    }),
    Track.findByIdAndUpdate(params.trackId, {
      $inc: {likeCount: 1},
    }),
  ]);

  return apiSuccess();
};

exports.unlike = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const trackCount = await Track.find({_id: params.trackId}).countDocuments();
  if (trackCount === 0) {
    return apiError(NOT_FOUND);
  }
  // If the user did not like trackId
  const existingCount = await UserLikeTrack.find({userId: userId, trackId: params.trackId}).countDocuments();
  if (existingCount === 0) {
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    Track.findByIdAndUpdate(params.trackId, {
      $inc: {likeCount: -1},
    }),
    UserLikeTrack.deleteMany({userId: userId, trackId: params.trackId}),
  ]);

  return apiSuccess();
};

exports.likeCount = async function(params) {
  const track = await Track.findById(params.trackId).select('likeCount');
  if (!track) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(track.likeCount);
};


exports.likeStatus = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const trackCount = await Track.find({_id: params.trackId}).countDocuments();
  if (trackCount === 0) {
    return apiError(NOT_FOUND);
  }

  const likeCount = await UserLikeTrack.find({trackId: params.trackId, userId: userId}).countDocuments();
  if (likeCount === 0) {
    return apiSuccess(false);
  }
  return apiSuccess(true);
};

exports.delete = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const track = await Track.findById(params.trackId);

  if (!track) {
    return apiError(NOT_FOUND);
  }
  if (userId !== track.artistId.toString()) {
    return apiError(FORBIDDEN);
  }

  await Promise.all([
    User.findByIdAndUpdate(userId, {
      $inc: {trackCount: -1},
    }),
    Comment.deleteMany({targetId: params.trackId}),
    UserLikeTrack.deleteMany({trackId: params.trackId}),
    Track.findByIdAndRemove(params.trackId),
  ]);

  return apiSuccess();
};

exports.newReleases = async function(params) {
  const things = await Track.find({}).sort({releaseDate: -1}).limit(params.limit).exec();
  return apiSuccess(things);
};

exports.trending = async function(params) {
  const things = await Track.find({}).sort({likeCount: -1}).limit(params.limit).exec();
  return apiSuccess(things);
};

exports.favored = async function(params) {
  const userId = tokenService.getUserId(params.token);

  const query = await UserLikeTrack.aggregate([
    {$match: {userId: new ObjectId(userId)}},
    {
      $lookup: {
        from: 'tracks',
        localField: 'trackId',
        foreignField: '_id',
        as: 'likes',
      },
    },
    {
      $unwind: {path: '$likes'},
    },
    {
      $replaceWith: '$likes',
    },
  ]).sort({uploadDate: 1}).exec();

  return apiSuccess(query);
};

exports.edit = async function(params) {
  const track = await Track.findById(params.trackId);
  if (!track) {
    return apiError(NOT_FOUND);
  }

  const userId = tokenService.getUserId(params.token);
  if (userId !== track.artistId.toString()) {
    return apiError(FORBIDDEN);
  }

  const colors = [];
  await Vibrant.from(params.coverUrl).getPalette()
      .then((palette) => {
        colors.push(palette.DarkMuted.getRgb());
        colors.push(palette.Vibrant.getRgb());
        colors.push(palette.LightVibrant.getRgb());
      });

  await Track.findByIdAndUpdate(params.trackId, {
    $set: {
      coverUrl: params.coverUrl,
      title: params.title,
      genre: params.genre,
      tags: params.tags,
      description: params.description,
    },
  });

  return apiSuccess();
};
