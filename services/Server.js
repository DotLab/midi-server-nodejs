module.exports = class Server {
  constructor(storage, tempPath) {
    this.storage = storage;
    this.tempPath = tempPath;
    this.bucketName = 'scarletea';
    this.bucket = storage.bucket(this.bucketName);
  }

  bucketUploadPublic(file, destination) {
    return this.bucket.upload(file, {
      destination, metadata: {
        gzip: true,
        cacheControl: 'public, max-age=31536000',
        acl: [{entity: 'allUsers', role: this.storage.acl.READER_ROLE}],
      },
    });
  }

  bucketUploadPrivate(file, destination) {
    return this.bucket.upload(file, {destination});
  }

  bucketGetPublicUrl(path) {
    return 'https://storage.googleapis.com/' + this.bucketName + '/' + path;
  }

  async generateSignedUrl(filename) {
    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000,
    };

    const [url] = await this.storage.bucket(this.bucketName)
        .file(filename).getSignedUrl(options);
    return url;
  }
};
