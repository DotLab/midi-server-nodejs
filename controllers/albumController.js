const User = require('../models/User');
const Thing = require('../models/Thing');
const Make = require('../models/Make');
const Comment = require('../models/Comment');
const UserLikeMake = require('../models/UserLikeMake');
const tokenService = require('../services/tokenService');
const {apiError, apiSuccess} = require('./utils');
const {BAD_REQUEST, FORBIDDEN, NOT_FOUND, calcFileHash} = require('./utils');
const Server = require('../services/Server');
const {Storage} = require('@google-cloud/storage');

const tempPath = './tempMake';
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

  const hash = calcFileHash(params.buffer);
  if (!hash) {
    return apiError(BAD_REQUEST);
  }

  const remotePath = `/makes/${hash}.jpg`;
  const localPath = `${tempPath}/${hash}.jpg`;

  const url = server.bucketGetPublicUrl(remotePath);

  fs.writeFileSync(localPath, params.buffer, 'base64');
  await server.bucketUploadPublic(localPath, remotePath);
  fs.unlink(localPath, () => {});

  const userId = tokenService.getUserId(params.token);
  const userName = await User.findOne({_id: userId}).select('userName');

  await Make.create({
    uploaderId: userId,
    uploaderName: userName.userName,

    fileName: params.fileName,
    fileSize: params.fileSize,
    hash: hash,
    path: remotePath,
    pictureUrl: url,

    sourceThingId: params.sourceThingId,
    sourceThingName: params.sourceThingName,
    sourceThingUploaderId: params.sourceThingUploaderId,
    sourceThingUploaderName: params.sourceThingUploaderName,

    description: params.description,
    printerBrand: params.printerBrand,
    raft: params.raft,
    support: params.support,
    resolution: params.resolution,
    infill: params.infill,
    filamentBrand: params.filamentBrand,
    filamentColor: params.filamentColor,
    filamentMaterial: params.filamentMaterial,
    note: params.note,

    uploadDate: new Date(),
    likeCount: 0,
    commentCount: 0,
  });
  await Thing.findByIdAndUpdate(params.sourceThingId, {
    $inc: {makeCount: 1},
  });

  return apiSuccess(url);
};

exports.detail = async function(params) {
  const make = await Make.findById(params.makeId).select('sourceThingId sourceThingName sourceThingUploaderName pictureUrl uploaderName description printerBrand raft support resolution infill filamentBrand filamentColor filamentMaterial note uploadDate likeCount commentCount');
  if (!make) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(make);
};

exports.like = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const makeCount = await Make.find({_id: params.makeId}).countDocuments();
  if (makeCount === 0) {
    return apiError(NOT_FOUND);
  }
  const existingCount = await UserLikeMake.find({userId: userId, makeId: params.makeId}).countDocuments();
  if (existingCount > 0) {
    // The user already liked makeId
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    UserLikeMake.create({
      userId: userId,
      makeId: params.makeId,
    }),
    Make.findByIdAndUpdate(params.makeId, {
      $inc: {likeCount: 1},
    }),
  ]);

  return apiSuccess();
};

exports.unlike = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const makeCount = await Make.find({_id: params.makeId}).countDocuments();
  if (makeCount === 0) {
    return apiError(NOT_FOUND);
  }
  // If the user did not like makeId
  const existingCount = await UserLikeMake.find({userId: userId, makeId: params.makeId}).countDocuments();
  if (existingCount === 0) {
    return apiError(BAD_REQUEST);
  }

  await Promise.all([
    Make.findByIdAndUpdate(params.makeId, {
      $inc: {likeCount: -1},
    }),
    UserLikeMake.deleteMany({userId: userId, makeId: params.makeId}),
  ]);

  return apiSuccess();
};

exports.likeCount = async function(params) {
  const make = await Make.findById(params.makeId).select('likeCount');
  if (!make) {
    return apiError(NOT_FOUND);
  }
  return apiSuccess(make.likeCount);
};

exports.likeStatus = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const makeCount = await Make.find({_id: params.makeId}).countDocuments();
  if (makeCount === 0) {
    return apiError(NOT_FOUND);
  }

  const likeCount = await UserLikeMake.find({makeId: params.makeId, userId: userId}).countDocuments();
  if (likeCount === 0) {
    return apiSuccess(false);
  }
  return apiSuccess(true);
};

exports.createComment = async function(params) {
  const userId = tokenService.getUserId(params.token);
  const user = await User.findOne({_id: userId}).select('userName avatarUrl');
  const make = await Make.findById(params.makeId);
  if (!make) {
    return apiError(NOT_FOUND);
  }

  await Comment.create({
    targetId: params.makeId,
    targetAuthorId: make.uploaderId,
    commentAuthorId: userId,
    commentAuthorName: user.userName,
    commentAuthorAvatarUrl: user.avatarUrl,
    body: params.comment,
    date: new Date(),
  });

  Make.findByIdAndUpdate(params.makeId, {
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
    Make.findByIdAndUpdate(comment.targetId, {
      $inc: {commentCount: -1},
    }),
    Comment.findByIdAndRemove(params.commentId),
  ]);

  return apiSuccess();
};

exports.commentList = async function(params) {
  const count = await Make.find({_id: params.makeId}).countDocuments();
  if (count === 0) {
    return apiError(BAD_REQUEST);
  }

  const comments = await Comment.find({targetId: params.makeId}).sort({date: -1}).limit(params.limit).lean().exec();
  const userId = tokenService.getUserId(params.token);

  comments.forEach((comment) => {
    comment.isOwner = (comment.targetAuthorId == userId || comment.commentAuthorId == userId) ? true : false;
  });

  return apiSuccess(comments);
};

exports.latestMakes = async function(params) {
  const makes = await Make.find({}).sort({uploadDate: -1}).limit(params.limit).exec();
  return apiSuccess(makes);
};
