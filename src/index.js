import 'babel-polyfill';
import glob from 'glob';
import flatten from 'lodash/array/flatten';
import minimist from 'minimist';
import co from 'co';

import { deploy } from './deploy';

co(function *() {
  // Get arguments that were passed from the command line.
  const argv = minimist(process.argv.slice(2));

  // Create options object, based on command line arguments.
  const options = {
    bucket: argv.bucket,
    region: argv.r || argv.region || 'us-east-1',
    cwd: argv.cwd || '',
    profile: argv.profile,
    gzip: (argv.gzip ? 'gzip' : undefined),
  };

  if(argv.hasOwnProperty('filePrefix')) {
    options.filePrefix = argv.filePrefix;
  }

  if(argv.hasOwnProperty('cache')) {
    options.cache = argv.cache;
  }

  if(argv.hasOwnProperty('immutable')) {
    options.immutable = true;
  }

  if(argv.hasOwnProperty('etag')) {
    options.etag = argv.etag;
  }

  if(argv.hasOwnProperty('private')) {
    options.private = true;
  }

  if(argv.hasOwnProperty('ext')) {
    options.ext = argv.ext;
  }

  if(argv.hasOwnProperty('signatureVersion')) {
    options.signatureVersion = argv.signatureVersion;
  }

  // Get paths of all files from the glob pattern(s) that were passed as the
  // unnamed command line arguments.
  const globbedFiles = flatten(argv._.filter(Boolean).map(function(pattern) {
    return glob.sync(pattern);
  }));

  let cacheControl = [];
  if (options.hasOwnProperty('cache')) cacheControl.push('max-age=' + options.cache);
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

  const AWSOptions = {
    region: options.region
  };

  const s3Options = {
    Bucket: options.bucket,
    ContentEncoding: options.gzip,
    CacheControl: cacheControl
  };

  if(options.hasOwnProperty('etag')) {
    s3Options.Metadata = {
      ETag: options.etag
    };
  }

  if(options.private) {
    s3Options.ACL = 'private';
  }

  const s3ClientOptions = {};

  if(options.hasOwnProperty('signatureVersion')) {
    s3ClientOptions.signatureVersion = options.signatureVersion;
  }

  // Starts the deployment of all found files.
  return yield deploy(globbedFiles, options, AWSOptions, s3Options, s3ClientOptions);
})
.then(() => {
  console.log('All files uploaded.');
})
.catch(err => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(String(err));
  }

  process.exit(1); // eslint-disable-line
});
