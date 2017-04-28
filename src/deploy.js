import util from 'util';
import path from 'path';
import zlib from 'zlib';

import AWS from 'aws-sdk';
import clone from 'lodash/lang/clone';
import fs from 'co-fs-extra';
import co from 'co';

import * as utils from './utils';
import * as MSG from './MSG';

/**
 * Uploads a file to AWS S3 bucket.
 * @param  {Object} client AWS Client object.
 * @param  {Object} file   File details of a file to be uploaded.
 * @param  {Object} opts   Object with additional AWS parameters.
 * @return {Promise}        Returns a promise which resolves with a log message of upload status.
 */
export function upload(client, file, opts, filePrefix, ext) {
  return new Promise((resolve, reject) => {
    opts = Object.assign({
      ACL: 'public-read'
    }, opts);

    var params = Object.assign({}, utils.buildUploadParams(file, filePrefix, ext), opts);
    params = utils.handleETag(params);
    var dest = params.Key;

    // Upload the file to s3.
    client.putObject(params, function(err) {
      if (err) {
        return reject(util.format(MSG.ERR_UPLOAD, err, err.stack));
      }

      return resolve(util.format(MSG.UPLOAD_SUCCESS, params.Bucket, dest));
    });
  });
}

/**
 * Checks if file is already in the S3 bucket.
 * @param  {Object} client AWS Client object.
 * @param  {Object} file   File details of a file to check.
 * @param  {Object} opts   Object with additional AWS parameters.
 * @return {Promise}       Returns a promise which rejects if file already exists,
 *                         and doesn't need update. Otherwise fulfills.
 */
export function sync(client, file, opts, filePrefix) {
  return new Promise((resolve, reject) => {
    var params = Object.assign({
      IfNoneMatch: utils.createMd5Hash(file.contents),
      IfUnmodifiedSince: file.stat.mtime
    }, utils.buildBaseParams(file, filePrefix), opts);

    client.headObject(params, function(err) {
      if (err && (err.statusCode === 304 || err.statusCode === 412)) {
        return reject(util.format(MSG.SKIP_MATCHES, params.Key));
      }

      resolve();
    });
  });
}

/**
 * Checks if the provided path is a file or directory.
 * If it is a file, it returns file details object.
 * Otherwise it returns undefined.
 */
export const readFile = co.wrap(function *(filepath, cwd, gzipFiles) {
  var stat = fs.statSync(filepath);
  if(stat.isFile()) {
    let fileContents = yield fs.readFile(filepath, {encoding: null});

    if(gzipFiles) {
      fileContents = zlib.gzipSync(fileContents);
    }

    return {
      stat: stat,
      contents: fileContents,
      base: path.join(process.cwd(), cwd),
      path: path.join(process.cwd(), filepath)
    };
  }

  return undefined;
});

/**
 * Handles a path, by obtaining file details for a provided path,
 * checking if file is already in AWS bucket and needs updates,
 * and uploading files that are not there yet, or do need an update.
 */
export const handleFile = co.wrap(function *(filePath, cwd, filePrefix, client, s3Options, ext) {
  const fileObject = yield readFile(filePath, cwd, s3Options.ContentEncoding !== undefined);

  if(fileObject !== undefined) {
    try {
      yield sync(client, fileObject, filePrefix, s3Options);
    } catch (e) {
      console.log(e);
      return;
    }

    const fileUploadStatus = yield upload(client, fileObject, s3Options, filePrefix, ext);
    console.log(fileUploadStatus);
  }
});

/**
 * Entry point, creates AWS client, prepares AWS options,
 * and handles all provided paths.
 */
export const deploy = co.wrap(function *(files, options, AWSOptions, s3Options, clientOptions = {}) {
  AWSOptions = clone(AWSOptions, true);
  s3Options = clone(s3Options, true);
  const cwd = options.cwd;
  const filePrefix = options.filePrefix || '';


  if(options.profile) {
    var credentials = new AWS.SharedIniFileCredentials({profile: options.profile});
    AWS.config.credentials = credentials;
  }

  AWS.config.update(Object.assign({
    sslEnabled: true
  }, AWSOptions));

  var client = new AWS.S3(clientOptions);

  yield Promise.all(files.map(function(filePath) {
    return handleFile(filePath, cwd, filePrefix, client, s3Options, options.ext);
  }));
});
