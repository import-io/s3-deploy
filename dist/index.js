'use strict';

require('babel-polyfill');

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _flatten = require('lodash/array/flatten');

var _flatten2 = _interopRequireDefault(_flatten);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _deploy = require('./deploy');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _co2.default)(regeneratorRuntime.mark(function _callee() {
  var argv, options, globbedFiles, cacheControl, AWSOptions, s3Options, s3ClientOptions;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // Get arguments that were passed from the command line.
          argv = (0, _minimist2.default)(process.argv.slice(2));

          // Create options object, based on command line arguments.

          options = {
            bucket: argv.bucket,
            region: argv.r || argv.region || 'us-east-1',
            cwd: argv.cwd || '',
            profile: argv.profile,
            gzip: argv.gzip ? 'gzip' : undefined
          };


          if (argv.hasOwnProperty('filePrefix')) {
            options.filePrefix = argv.filePrefix;
          }

          if (argv.hasOwnProperty('cache')) {
            options.cache = argv.cache;
          }

          if (argv.hasOwnProperty('immutable')) {
            options.immutable = true;
          }

          if (argv.hasOwnProperty('etag')) {
            options.etag = argv.etag;
          }

          if (argv.hasOwnProperty('private')) {
            options.private = true;
          }

          if (argv.hasOwnProperty('ext')) {
            options.ext = argv.ext;
          }

          if (argv.hasOwnProperty('signatureVersion')) {
            options.signatureVersion = argv.signatureVersion;
          }

          // Get paths of all files from the glob pattern(s) that were passed as the
          // unnamed command line arguments.
          globbedFiles = (0, _flatten2.default)(argv._.filter(Boolean).map(function (pattern) {
            return _glob2.default.sync(pattern);
          }));
          cacheControl = [];

          if (typeof options.cache == 'number') cacheControl.push('max-age=' + options.cache);
          if (options.immutable) cacheControl.push('immutable');
          cacheControl = cacheControl.length ? cacheControl.join(', ') : undefined;

          console.log('Deploying files: %s', globbedFiles);
          console.log('> Target S3 bucket: %s (%s region)', options.bucket, options.region);
          console.log('> Target file prefix: %s', options.filePrefix);
          console.log('> Gzip:', options.gzip);
          console.log('> Cache-Control:', cacheControl);
          console.log('> E-Tag:', options.etag);
          console.log('> Private:', options.private ? true : false);
          if (options.ext) console.log('> Ext:', options.ext);

          AWSOptions = {
            region: options.region
          };
          s3Options = {
            Bucket: options.bucket,
            ContentEncoding: options.gzip,
            CacheControl: cacheControl
          };


          if (options.hasOwnProperty('etag')) {
            s3Options.Metadata = {
              ETag: options.etag
            };
          }

          if (options.private) {
            s3Options.ACL = 'private';
          }

          s3ClientOptions = {};


          if (options.hasOwnProperty('signatureVersion')) {
            s3ClientOptions.signatureVersion = options.signatureVersion;
          }

          // Starts the deployment of all found files.
          _context.next = 30;
          return (0, _deploy.deploy)(globbedFiles, options, AWSOptions, s3Options, s3ClientOptions);

        case 30:
          return _context.abrupt('return', _context.sent);

        case 31:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
})).then(function () {
  console.log('All files uploaded.');
}).catch(function (err) {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(String(err));
  }

  process.exit(1); // eslint-disable-line
});