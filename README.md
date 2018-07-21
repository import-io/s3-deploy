# s3-deploy

NodeJS bash utility for deploying files to Amazon S3

## Usage

```
s3-deploy './dist/**' --cwd './dist/' --region AWS_REGION --bucket SOME_BUCKET_NAME --distId CF_DIST_ID --invalidate '/INV_PATH_1 /INV_PATH_2'
```

Deploys files found by the `./dist/**` glob patten to S3. Change `AWS_REGION` with the AWS region of your bucket and `SOME_BUCKET_NAME` with the name of your bucket where files should end up. It's a common scenario to invalidate files in CloudFront distribution, just pass distribution ID to `--distId` to invalidate everything.

### Optional parameters

```
--config filepath
```

This will use the options found in the specified config file as an alternative to CLI arguments. If additional CLI arguments are specified, they will overwrite values found in the config file.

```
--gzip [ETX,...]
```

Specifying `--gzip` will gzip all files before sending them to S3, and adds appropriate `Content-Encoding: gzip` metadata attribute on uploaded elements in S3, so that when they are opened in the browser, the browser knows to decompress them first before displaying. You can specify the list of file extensions to gzip, e.g. `--gzip xml,html,htm,js,css,ttf,otf,svg,txt`.

```
--cache X
```

Use this parameter to specify the `Cache-Control: max-age=X` header, where X is the number of seconds a given item will be kept in the cache for. By default this value is undefined.

```
--preventUpdates
```

Use this parameter to validate that the object either currently does not exist in the bucket, or
that it already matches the ETag hash and thus is skipped and not uploaded. This effectively ensures that S3 Objects will not be modified. This is useful with the `--immutable` flag.

```
--immutable
```

When a page is refreshed, which is an extremely common social media scenario, elements that were previously marked immutable with an HTTP response header do not have to be revalidated with the server. It sets the `Cache-Control: immutable` header - [using-immutable-caching-to-speed-up-the-web](https://hacks.mozilla.org/2017/01/using-immutable-caching-to-speed-up-the-web/) This is useful with the `--preventUpdates` flag.

```
--etag X
```

You can also specify the `ETag: X` header, where X is either user-defined value for this header, or MD5 of the content. To automatically fill this header with MD5 hash of the file, just use `--etag` parameter without any value. Internally the tool will generate MD5 hash of the content and will set it as the ETag header value. By default this parameter is undefined.

```
--signatureVersion v4
```

You can also specify the `signatureVersion` that should be used by S3 client. Current allowed values are the same as in the constructor of the [S3 JS SDK Client](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property). In the time of writing those docs those values were `v2`, `v3` and `v4`.

```
--filePrefix
```

Use this parameter to specify a file prefix for all your destination files. For example, if you wanted to deploy a versioned history of your project to S3 whenever publishing to npm, you could use `--filePrefix $npm_package_version` in a script in your project's package.json file.

```
--profile
```

You can specify a specific AWS profile to use to connect to S3 (defaults to `default`). More information on how to setup AWS profiles is available in the [AWS docs](http://docs.aws.amazon.com/cli/latest/topic/config-vars.html).

```
--private
```

Use this parameter to specify that objects being uploaded will be stored with private ACL (Owner gets FULL_CONTROL. No one else has access rights). By default, 'public-read' ACL is set. More information on the canned-acl is available in the [AWS docs](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl)

```
--ext
```

Enables to set the correct content type header when files has no extension. For example, when the s3 bucket is used for webhosting and there is need to access paths like `/about` instead of `/about.html` so its possible to upload file named `about` and set `--ext html`

```
--deleteRemoved
```

Removes files in S3, that are not available in the local copy of the directory. Useful to cleanup files that should no longer reside in the remote version.

```
--index
```

If a filename in a subdirectory matches the index file, then upload two additional copies of the file: one with the same name as the directory, and one with the name of the directory followed by "/". This can be used to fake "index.html" on S3 and CloudFront, which normally has no concept of default index files.

```
--distId
```

CloudFront Distribution ID. Use along with `--invalidate` to invalides files within given distribution. In case `--invalidate` isn't provided everything is invalidated.

```
--invalidate
```

Paths to invalidate within CloudFront distribution. Value must be wrapped with quotes and each file separated by whitespace character. `--distId` argument is mandatory. Defaults to `['/']`. More details here:
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html.

## AWS Credentials

AWS credentials can be provided via environment variables, or in the `~/.aws/credentials` file. More details here:
http://docs.aws.amazon.com/cli/latest/topic/config-vars.html. Please make sure to define a default in your AWS credentials, this will help prevent a `Missing Credentials` error during deployment.

## Commands

### Production build

```
npm run release
```

Runs eslint validation, runs all unit tests.

### Run all tests

```
npm test
```

Invokes all unit tests in the project.

### Generage coverage report

```
npm run coverage
```

Generates unit test coverage report.

### Run linting

```
npm run lint
```

Invokes eslint validation based on rules defined in the `.eslintrc` file.

## Releasing

* Commit changes to the repository on a separate branch,
* Bump version in package.json file, after you are done with your changes (remember about SemVer!),
* After you are done with your functionality, or if you think it is large enough, create a pull request with master branch to be peer reviewed,
* After changes are merged into master branch, checkout master branch, run tests one more time, and publish this package to npm repository.

## Changelog

### 1.2.0

**API Additions**

* Pass a config file to `--config` as an alternative to specifying arguments on the CLI. 
* If both `--config` and additional CLI arguments are specified, CLI arguments will override config file values.

### 1.1.0

**API Additions**

* Pass file extensions to `--gzip` to zip only the given list. E.g. `--gzip xml,html,htm,js,css,ttf,otf,svg,txt`.

### 1.0.0

**No changes**

The v0.11 re-published to follow stricter SemVer.

### 0.11.0

**API Additions**

* Added a new feature to invalidate paths in CloudFront using `--distId` (distribution id) and `--invalidate` (paths to invalidate).

### 0.10.0

**API Additions**

* Addition of the `--preventUpdates` & `--immutable` parameters.

### 0.9.0

**API Additions**

* Addition of the `--index` parameter.

### 0.8.0

**API Additions**

* Fix for windows setup.

### 0.7.6

**API Additions**

* Adding he ability to cleanup old files in the remote location during the deployment

### 0.7.3

**API Additions**

* Adding the ability to set the extension if the files without one or there is need to override it

### 0.7.2

**Bug Fix**

* Reverting changes to readFile function from PR https://github.com/import-io/s3-deploy/pull/11 as unfortunately it caused other issues: https://github.com/import-io/s3-deploy/issues/14

### 0.7.1

**API Additions**

* Adding the ability to set private ACL for object

### 0.6.1

**Bug fix**

* Fixing incorrect folder structure when `s3-deploy` is used from windows machine.

### 0.6.0

**\*API Additions**

* Adding the ability to specify `filePrefix`

### 0.5.2

**Bug fix**

* Fixing the `aws-sdk` package version to `2.3.19`, because of: https://github.com/aws/aws-sdk-js/issues/1035

### 0.5.0

**API Additions**

* Adding the ability to specify `signatureVersion` in S3 client,
* Fixing the tool to work correctly when no `--etag` argument is used.

### 0.4.0

**API Additions**

* Adding ability to provide ETag header value.

### 0.3.1

**Patch/Bug Fixes**

* Fixing an issue with cache parameter.

### 0.3.0

**API Additions**

* Adding ability to specify Cache-Control max-age seconds.

### 0.2.1

**Bug/Patch fixes**

* Moving `babel` to be a dev-dependency.

### 0.2.0

**API additons**

* Adding new command line parameter `--gzip`. When this is added, all files will be gzipped before sending them to Amazon S3.

### 0.1.7

**Patch fixes**

* Updating the repository URL.

### 0.1.6

**Patch fixes**

* Adding ability to publish package from CircleCI.

### 0.1.5

**Bug fixes**

* Adding a missing `crypto` import in the utils.

### 0.1.4

**Patch fix**

* Publishing the package publicly.

### 0.1.3

**Bug fixes**

* Switching to a node script in .bin directory, as bash script doesn't work when it is used through the symlink.

### 0.1.2

**Bug fixes**

* Going back to babel pre-compilation, and adding an .sh script to run the command later on,
* Adding babel/polyfill to the package as we are using generators inside the command.

### 0.1.1

**Bug fixes**

* Fixed a bug which made teh package not run at all.

### 0.1.0

**API additions**

* Initial version of the project,
* Ability to deploy files in the given glob pattern to provided S3 bucket, on provided S3 region.
