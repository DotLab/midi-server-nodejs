const User = require('../models/User');
const Comment = require('../models/Comment');
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
  const user = await User.findOne({userName: params.userName}).select('displayName bio overview avatarUrl');
  if (!user) {
    return apiError(NOT_FOUND);
  }

  return apiSuccess(user);
};

exports.updateProfile = async function(params) {
  const userId = tokenService.getUserId(params.token);
  await User.findByIdAndUpdate(userId, {
    displayName: params.displayName,
    bio: params.bio,
    overview: params.overview,
  });

  return apiSuccess();
};

exports.userInfo = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const userInfo = await User.findById(userId).select('userName displayName bio avatarUrl overview');
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
  const artist = await User.findById(params.userId).select('bio overview followingCount followerCount trackCount albumCount');
  return apiSuccess(artist);
};
