import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const port=8789;
test('coach API validates requests and returns a local fallback',async(t)=>{
 const child=spawn(process.execPath,['server/index.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),AI_API_KEY:''},stdio:'ignore'});
 t.after(()=>child.kill());
 let ready=false;
 for(let i=0;i<30;i++){
  try{await fetch(`http://127.0.0.1:${port}/not-found`);ready=true;break;}catch{await delay(100);}
 }
 assert.equal(ready,true,'server should start');
 const wrongType=await fetch(`http://127.0.0.1:${port}/api/coach`,{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
 assert.equal(wrongType.status,415);
 const badJson=await fetch(`http://127.0.0.1:${port}/api/coach`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{' });
 assert.equal(badJson.status,400);
 const ok=await fetch(`http://127.0.0.1:${port}/api/coach`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:{title:'Example',claim:'A clear testable claim',url:'javascript:alert(1)'}})});
 assert.equal(ok.status,200);
 const payload=await ok.json();
 assert.equal(payload.mode,'local');
 assert.equal(payload.checks,undefined);
 assert.match(payload.headline,/research checks completed/);
});
