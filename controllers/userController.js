const User = require('../models/User');
const Comment = require('../models/Comment');
const Track = require('../models/Track');
const Album = require('../models/Album');
const UserFollowUser = require('../models/UserFollowUser');
const UserLikeTrack = require('../models/UserLikeTrack');
const UserLikeAlbum = require('../models/UserLikeAlbum');
const tokenService = require('../services/tokenService');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const {apiError, apiSuccess, genSecureRandomString, calcPasswordHash} = require('./utils');
const {FORBIDDEN, NOT_FOUND, BAD_REQUEST, calcFileHash} = require('./utils');
const sharp = require('sharp');
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

exports.register = async function(params) {
  const existingUserCount = await User.countDocuments({
    $or: [{userName: params.userName}, {email: params.email}],
  });

  if (existingUserCount > 0) {
    return apiError(FORBIDDEN);
  }

  const salt = genSecureRandomString();
  const hash = calcPasswordHash(params.password, salt);

  await User.create({
    userName: params.userName,
    displayName: params.displayName,
    email: params.email,
    passwordSalt: salt,
    passwordSha256: hash,
    overview: '',
    avatarUrl: '',
    followingCount: 0,
    followerCount: 0,
    trackCount: 0,
    albumCount: 0,
  });

  return apiSuccess();
};

exports.login = async function(params) {
  const user = await User.findOne({email: params.email});
  if (!user) {
    return apiError(FORBIDDEN);
  }

  const hash = calcPasswordHash(params.password, user.passwordSalt);
  if (hash !== user.passwordSha256) {
    return apiError(FORBIDDEN);
  }
  const token = tokenService.createToken(user.id);
  return apiSuccess(token);
};

exports.changePassword = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const user = await User.findById(userId);
  const hash = calcPasswordHash(params.oldPassword, user.passwordSalt);
  if (hash !== user.passwordSha256) {
    return apiError(FORBIDDEN);
  }
  const newSalt = genSecureRandomString();
  const newHash = calcPasswordHash(params.newPassword, newSalt);
  await User.findByIdAndUpdate(user._id, {
    $set: {
      passwordSalt: newSalt,
      passwordSha256: newHash,
    },
  });

  return apiSuccess();
};

exports.getUserMinimal = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const user = await User.findById(userId).select('userName displayName avatarUrl');
  if (!user) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(user);
};

exports.detail = async function(params) {
  const user = await User.findOne({userName: params.userName}).select('displayName  overview avatarUrl');
  if (!user) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(user);
};

exports.updateProfile = async function(params) {
  const userId = tokenService.getUserId(params.token);
  await User.findByIdAndUpdate(userId, {
    displayName: params.displayName,
    overview: params.overview,
  });

  return apiSuccess();
};

exports.userInfo = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const userInfo = await User.findById(userId).select('userName displayName  avatarUrl overview');
  return apiSuccess(userInfo);
};

exports.deleteAccount = async function(params) {
  const userId = tokenService.getUserId(params.token);
  await Comment.deleteMany({
    $or: [{targetAuthorId: userId}, {commentAuthorId: userId}],
  });
  await UserBookmarkThing.deleteMany({userId: userId});
  await UserLikeThing.deleteMany({userId: userId});
  await UserLikeMake.deleteMany({userId: userId});
  await Make.deleteMany({uploaderId: userId});
  await Thing.deleteMany({uploaderId: userId});
  await User.findByIdAndRemove(userId);

  return apiSuccess();
};

exports.avatarUpload = async function(params) {
  const storage = new Storage();
  const server = new Server(storage, tempPath);

  const hash = calcFileHash(params.buffer);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/imgs/${hash}.jpg`;
  const localPath = `${tempPath}/${hash}.jpg`;
  const buf = Buffer.from(params.buffer, 'base64');

  const url = server.bucketGetPublicUrl(remotePath);
  await sharp(buf).resize(256, 256).jpeg({quality: 80}).toFile(localPath);
  await server.bucketUploadPublic(localPath, remotePath);
  fs.unlink(localPath, () => { });

  const userId = tokenService.getUserId(params.token);
  await User.findByIdAndUpdate(userId, {avatarUrl: url});
  await Comment.updateMany({commentAuthorId: userId}, {commentAuthorAvatarUrl: url});

  return apiSuccess(url);
};

exports.getAvatarUrl = async function(params) {
  const avatarUrl = await User.findOne({userName: params.userName}).select('avatarUrl');
  return avatarUrl;
};


exports.artistInfo = async function(params) {
  if (params.userId) {
    const artist = await User.findById(params.userId).select('avatarUrl overview followingCount followerCount trackCount albumCount');
    if (!artist) {
      return apiError(NOT_FOUND);
    }
    return apiSuccess(artist);
  } else if (params.userName) {
    const artist = await User.find({userName: params.userName}).select('avatarUrl overview followingCount followerCount trackCount albumCount');
    if (!artist) {
      return apiError(NOT_FOUND);
    }
    return apiSuccess(artist[0]);
  }
};

exports.allMidi = async function(params) {
  const tracks = await Track.find({artistName: params.artistName}).sort({releaseDate: -1}).exec();
  const albums = await Album.find({artistName: params.artistName}).sort({releaseDate: -1}).exec();
  console.log(albums, tracks);
  return apiSuccess(tracks);
  // return apiSuccess(tracks.concat(albums));
};

exports.popularTracks = async function(params) {
  const tracks = await Track.find({artistName: params.artistName}).sort({releaseDate: -1}).limit(params.limit).exec();
  return apiSuccess(tracks);
};

exports.tracks = async function(params) {
  const tracks = await Track.find({artistName: params.artistName}).sort({releaseDate: -1}).exec();
  return apiSuccess(tracks);
};

exports.albums = async function(params) {
  const albums = await Album.find({artistName: params.artistName}).sort({releaseDate: -1}).exec();
  return apiSuccess(albums);
};

exports.follow = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const artist = await User.findOne({userName: params.artistName});
  if (artist === 0) {
    return apiError(NOT_FOUND);
  }
  const existingCount = await UserFollowUser.find({followingId: userId, followerId: artist.id}).countDocuments();
  if (existingCount > 0) {
    // The user already following user
    return apiError(BAD_REQUEST);
  }
  console.log(artist);
  await Promise.all([
    UserFollowUser.create({
      followingId: userId,
      followerId: artist._id,
    }),
    User.findByIdAndUpdate(userId, {
      $inc: {followingCount: 1},
    }),
    User.findByIdAndUpdate(artist._id, {
      $inc: {followerCount: 1},
    }),
  ]);

  return apiSuccess();
};

exports.unfollow = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const artist = await User.findOne({userName: params.artistName});
  if (!artist) {
    return apiError(NOT_FOUND);
  }
  const existingCount = await UserFollowUser.find({followerId: userId, followingId: artist._id}).countDocuments();
  if (existingCount === 0) {
    // The user is not following user
    return apiError(BAD_REQUEST);
  }
  console.log(artist);

  await Promise.all([
    User.findByIdAndUpdate(userId, {
      $inc: {followingCount: -1},
    }),
    User.findByIdAndUpdate(artist._id, {
      $inc: {followerCount: -1},
    }),
    UserFollowUser.deleteMany({
      followingId: userId,
      followerId: artist._id,
    }),
  ]);

  return apiSuccess();
};

exports.followStatus = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const artist = await User.findOne({userName: params.artistName});
  if (!artist) {
    return apiError(NOT_FOUND);
  }

  const likeCount = await UserFollowUser.find({followerId: userId, followingId: artist._id}).countDocuments();
  if (likeCount === 0) {
    return apiSuccess(false);
  }
  return apiSuccess(true);
};

exports.followerCount = async function(params) {
  const counts = await User.findOne({userName: params.artistName}).select('followerCount followingCount');

  if (!counts) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(counts);
};

exports.likedTracks = async function(params) {
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

exports.likedAlbums = async function(params) {
  const userId = tokenService.getUserId(params.token);

  const query = await UserLikeAlbum.aggregate([
    {$match: {userId: new ObjectId(userId)}},
    {
      $lookup: {
        from: 'albums',
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

exports.followerArtists = async function(params) {
  const userId = tokenService.getUserId(params.token);

  const query = await UserFollowUser.aggregate([
    {$match: {followingId: new ObjectId(userId)}},
    {
      $lookup: {
        from: 'users',
        localField: 'followingId',
        foreignField: '_id',
        as: 'followers',
      },
    },
    {
      $unwind: {path: '$followers'},
    },
    {
      $replaceWith: '$followers',
    },
    {
      $project: {'userName': 1, 'avatarUrl': 1},
    },
  ]).exec();

  return apiSuccess(query);
};

exports.followingArtists = async function(params) {
  const userId = tokenService.getUserId(params.token);

  const query = await UserFollowUser.aggregate([
    {$match: {followerId: new ObjectId(userId)}},
    {
      $lookup: {
        from: 'users',
        localField: 'followingId',
        foreignField: '_id',
        as: 'followings',
      },
    },
    {
      $unwind: {path: '$followings'},
    },
    {
      $replaceWith: '$followings',
    },
    {
      $project: {'userName': 1, 'avatarUrl': 1},
    },
  ]).exec();

  return apiSuccess(query);
};
