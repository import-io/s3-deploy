import crypto from 'crypto';

import mime from 'mime';

/**
 * Gets the content type of the file, based on it's extension.
 * @param  {String} src Path to file fow which content type should be evaluated.
 * @return {String}     Returns string with content type and charset.
 */
export function contentType(src, ext) {
  var type = mime.lookup(ext || src).replace('-', '');
  var charset = mime.charsets.lookup(type, null);

  if (charset) {
    type += '; charset=' + charset;
  }

  return type;
}

/**
 * Creates an MD5 hash of a give file.
 * @param  {String} data Contents of the file.
 * @return {String}      MD5 Hash of the file contents, returned as HEX string.
 */
export function createMd5Hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Creates an MD5 hash of a give file.
 * @param  {String} data Contents of the file.
 * @return {String}      MD5 Hash of the file contents, returned as Base64 string.
 */
export function base64Md5(data) {
  return crypto.createHash('md5').update(data).digest('base64');
}

/**
 * Returns a 'Key' attribute of a request to get info about file in AWS S3.
 * @param  {Object} file File object with information bout it's path.
 * @return {Object}      Returns an object with a 'Key' parameter,
 *                       being a base path of the file location, with slashes
 *                       removed from the path.
 */
export function buildBaseParams(file, filePrefix) {
  var dest = file.path.replace(file.base, '');
  dest = dest.replace(/^\//, '');
  if (filePrefix) {
    dest = filePrefix + '/' + dest;
  }
  return {
    Key: dest
  };
}

/**
 * Takes a file object, and prepares parameters required during AWS S3 file upload.
 * @param  {Object} file File object, with all it's details.
 * @return {Object}      AWS S3 upload function parameters.
 */
export function buildUploadParams(file, filePrefix, ext) {
  var params = Object.assign({
    ContentMD5: base64Md5(file.contents),
    Body: file.contents,
    ContentType: contentType(file.path, ext)
  }, buildBaseParams(file, filePrefix));

  return params;
}

export function handleETag(opts) {
  if(opts.Metadata && opts.Metadata.ETag === true) {
    opts.Metadata.ETag = opts.ContentMD5;
  }

  return opts;
}
