const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mode,select}=require('../scripts/browser_scope.cjs');
test('presentation changes use smoke while runtime, HTML and unknown paths retain integration',()=>{
  assert.equal(mode(['ROADMAP.md','site/styles.css']),'smoke');
  for(const p of ['site/playground.json','site/native-release.json','release-source.json','site/index.html','scripts/assemble_site.sh','.github/workflows/check.yml','new-file']) {
    assert.equal(mode(['README.md',p]),'full');
  }
  assert.equal(mode([]),'full');
});
test('missing revisions and diff failures cannot bypass browser integration',()=>{
  assert.equal(select('', 'b'.repeat(40)),'full');
  assert.equal(select('0'.repeat(40),'b'.repeat(40)),'full');
  assert.equal(select('a'.repeat(40),'b'.repeat(40),()=>{throw Error('missing revision')}),'full');
  assert.equal(select('a'.repeat(40),'b'.repeat(40),()=>'docs/MIGRATION.md\0'),'smoke');
  assert.equal(select('a'.repeat(40),'b'.repeat(40),()=>'README.md\0site/playground.json\0'),'full');
});
