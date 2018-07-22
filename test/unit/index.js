const chai = require('chai');
const expect = chai.expect;

const { parseCliArgsToOptions } = require('../../src/index');

describe('#parseCliArgsToOptions()', () => {
  describe('--gzip', async () => {
    it('should be true if present', () => {
      expect(parseCliArgsToOptions([0, 0, '--gzip']).gzip).to.equal(true);
    });

    it('should be array if arg is given', () => {
      expect(parseCliArgsToOptions([0, 0, '--gzip', 'js,css,html']).gzip).to.deep.equal(['js', 'css', 'html']);
    });
  });
  describe('--config', async() => {
    it('should include options from a config file', () => {
      expect(parseCliArgsToOptions([0, 0, '--config', './test/data/config.json']).gzip).to.deep.equal(['js', 'css']);
    });
    it('should override options from a config file with arguments', () => {
      expect(parseCliArgsToOptions([0, 0, '--config', './test/data/config.json', '--bucket', 'overridebucket']).bucket).to.equal('overridebucket');
    });
  });
});
