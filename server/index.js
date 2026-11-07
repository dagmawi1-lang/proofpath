import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {coachNotes,normalizeSource} from './review.js';

if(existsSync('.env')){
  for(const line of readFileSync('.env','utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if(m&&!process.env[m[1]]) process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
  }
}
const port=Number(process.env.PORT||8787);
const allowedOrigin=process.env.ALLOWED_ORIGIN||'http://localhost:5173';
const headers={
  'Content-Type':'application/json; charset=utf-8',
  'Access-Control-Allow-Origin':allowedOrigin,
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Vary':'Origin',
  'X-Content-Type-Options':'nosniff'
};
function send(res,status,payload){res.writeHead(status,headers);res.end(JSON.stringify(payload));}
const server=http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,headers);return res.end();}
  if(req.method!=='POST'||req.url!=='/api/coach') return send(res,404,{error:'Not found'});
  if(!String(req.headers['content-type']||'').includes('application/json')) return send(res,415,{error:'Send JSON using Content-Type: application/json.'});
  let raw='';
  try{
    for await(const chunk of req){raw+=chunk;if(raw.length>32_768){send(res,413,{error:'Request is too large.'});req.destroy();return;}}
  }catch{return send(res,400,{error:'Could not read request.'});}
  let body;
  try{body=JSON.parse(raw||'{}');}catch{return send(res,400,{error:'Invalid JSON.'});}
  if(!body||typeof body!=='object'||Array.isArray(body)) return send(res,400,{error:'Expected a JSON object.'});
  const source=normalizeSource(body.source&&typeof body.source==='object'?body.source:{});
  let result=coachNotes(source);
  if(process.env.AI_API_KEY){
    try{
      const base=(process.env.AI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
      const response=await fetch(`${base}/chat/completions`,{
        method:'POST',headers:{'Authorization':`Bearer ${process.env.AI_API_KEY}`,'Content-Type':'application/json'},
        signal:AbortSignal.timeout(15000),
        body:JSON.stringify({model:process.env.AI_MODEL||'gpt-4o-mini',temperature:0.2,messages:[
          {role:'system',content:'You are a student research-process coach. Do not decide whether claims are true, rank sources, or provide authoritative fact checks. Identify up to five practical evidence gaps using only supplied fields. Return JSON with headline, notes array, disclaimer.'},
          {role:'user',content:JSON.stringify(source)}
        ],response_format:{type:'json_object'}})
      });
      if(!response.ok) throw new Error(`AI provider returned ${response.status}`);
      const data=await response.json();
      const parsed=JSON.parse(data.choices?.[0]?.message?.content||'{}');
      result={headline:typeof parsed.headline==='string'?parsed.headline.slice(0,180):result.headline,
        notes:Array.isArray(parsed.notes)?parsed.notes.filter(x=>typeof x==='string').slice(0,5).map(x=>x.slice(0,350)):result.notes,
        disclaimer:typeof parsed.disclaimer==='string'?parsed.disclaimer.slice(0,350):result.disclaimer,mode:'ai'};
    }catch{
      result={...result,providerNote:'AI service unavailable; showing the local checklist instead.'};
    }
  }
  return send(res,200,result);
});
server.listen(port,()=>console.log(`ProofPath API listening on http://localhost:${port}`));
