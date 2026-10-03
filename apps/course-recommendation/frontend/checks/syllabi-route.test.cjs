const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'app/course-plan/api/syllabi/route.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const course = {name:'Robotics', credits:3, professor:'Kim', category:'전공선택', syllabus:'Practice', schedule:[{day:'월', start:600, end:660}]};
function route(keys, respond, env = {}) {
  class ApiError extends Error { constructor(status) { super('test'); this.status=status; } }
  const exports = {};
  const calls = [];
  class GoogleGenAI { constructor({apiKey}) { this.models={generateContent:async args=>{calls.push(apiKey);assert.equal(args.config.responseMimeType,'application/json');return respond(apiKey,ApiError,args.model);}}; } }
  const environment = {env:{GEMINI_API_KEYS:keys,...env}};
  const sdk = {GoogleGenAI,ApiError,ThinkingLevel:{MINIMAL:"minimal"}};
  const helperExports = {};
  const helperSource = ts.transpileModule(fs.readFileSync(path.join(root,'lib/gemini.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(helperSource, {exports:helperExports, require:()=>sdk, process:environment, console, Math:Object.assign(Object.create(Math),{random:()=>0})});
  vm.runInNewContext(output, {exports, require:name=>name==='@/lib/gemini'?helperExports:sdk, process:environment, Response, File, FormData, Buffer, AbortSignal, DOMException, Error, console});
  return {post:exports.POST,calls};
}
function request(name='test.pdf', content='%PDF-1.4 fixture') {
  const form=new FormData();form.append('file',new File([content],name,{type:'application/pdf'}));
  return new Request('http://localhost/api/syllabi',{method:'POST',body:form});
}
test('rotates GEMINI_API_KEYS on quota errors and returns validated extraction',async()=>{
  const r=route('first, second',(key,ErrorType)=>{if(key==='first')throw new ErrorType(429);return {text:JSON.stringify({courses:[course]})};});
  const response=await r.post(request());assert.equal(response.status,200);assert.deepEqual(r.calls,['first','second']);assert.equal((await response.json()).courses[0].name,'Robotics');
});
test('missing keys and invalid files never call AI',async()=>{
  const r=route('',()=>{throw Error('must not call');});
  assert.equal((await r.post(request())).status,503);
  assert.equal((await r.post(request('bad.txt'))).status,400);
  assert.equal((await r.post(request('bad.pdf','not pdf'))).status,400);
  assert.equal((await r.post(request('big.pdf','%PDF-'+ 'x'.repeat(3*1024*1024)))).status,413);
  assert.equal(r.calls.length,0);
});
test('missing document facts remain missing for user review',async()=>{
  const r=route('key',()=>({text:JSON.stringify({courses:[{...course,credits:null,schedule:[]}]})}));
  const response=await r.post(request());assert.equal(response.status,200);assert.equal((await response.json()).courses[0].credits,null);
});
test('invalid AI output and invalid meeting times are rejected',async()=>{
  for(const value of [{courses:[{...course,credits:100}]},{courses:[{...course,schedule:[{day:'월',start:600,end:500}]}]},{courses:'wrong'}]) {
    const r=route('key',()=>({text:JSON.stringify(value)}));assert.equal((await r.post(request())).status,502);
  }
});
test('nonretryable errors do not consume every key',async()=>{
  const r=route('first,second',(_,ErrorType)=>{throw new ErrorType(400);});assert.equal((await r.post(request())).status,502);assert.deepEqual(r.calls,['first']);
});

test('unavailable configured model falls back to a supported model',async()=>{
  const models=[];
  const r=route('key',(_,ErrorType,model)=>{models.push(model);if(model==='old-model')throw new ErrorType(404);return {text:JSON.stringify({courses:[course]})};},{COURSE_PLAN_GEMINI_MODEL:'old-model'});
  assert.equal((await r.post(request())).status,200);assert.deepEqual(models,['old-model','gemini-3.5-flash-lite']);
});
test('quota, authentication, unavailable model and timeout have actionable errors',async()=>{
  for(const [upstream,status,code] of [[429,429,'GEMINI_QUOTA'],[401,503,'GEMINI_AUTH'],[404,503,'GEMINI_MODEL'],[503,503,'GEMINI_UNAVAILABLE']]) {
    const r=route('key',(_,ErrorType)=>{throw new ErrorType(upstream);});const response=await r.post(request());assert.equal(response.status,status);assert.equal((await response.json()).code,code);
  }
  const r=route('key',()=>{throw new DOMException('timeout','TimeoutError');});const response=await r.post(request());assert.equal(response.status,504);assert.equal((await response.json()).code,'GEMINI_TIMEOUT');
});

test('a timed out model falls back and keeps the Saturday class time',async()=>{
  const models=[];
  const r=route('key',(_,ErrorType,model)=>{
    models.push(model);
    if(models.length===1)throw new DOMException('timeout','TimeoutError');
    return {text:JSON.stringify({courses:[{...course,schedule:[{day:'토',start:660,end:780}]}]})};
  });
  const response=await r.post(request());
  assert.equal(response.status,200);
  assert.deepEqual(models,['gemini-3.8-flash','gemini-3.5-flash-lite']);
  assert.deepEqual((await response.json()).courses[0].schedule,[{day:'토',start:660,end:780}]);
});
