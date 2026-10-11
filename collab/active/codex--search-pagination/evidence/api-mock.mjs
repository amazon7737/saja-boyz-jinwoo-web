import http from 'node:http';
const requests=[];
let failures=0;
function article(index){return {collection_id:'qa',article_id:index.toString(16).padStart(64,'0'),image_status:'disabled',image_url:null,article:{title:'기사 '+index,description:'기사 요약 '+index,pubDate:'2026-10-11T00:00:00Z',originallink:'https://publisher.example.invalid/'+index,link:''}};}
const batch=(start=0)=>Array.from({length:20},(_,i)=>article(start+i));
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('Content-Type','application/json');
 if(url.pathname==='/reset'){requests.length=0;failures=0;res.end('{"status":"ok"}');return;}
 if(url.pathname==='/requests'){res.end(JSON.stringify(requests));return;}
 if(url.pathname!=='/news'){res.writeHead(404);res.end('{}');return;}
 const keyword=url.searchParams.get('keyword'); const offset=Number(url.searchParams.get('offset'));
 requests.push({keyword,offset,limit:url.searchParams.get('limit')});
 if(keyword==='재시도'&&offset===20){await new Promise(r=>setTimeout(r,600));if(failures++===0){res.writeHead(503);res.end('{"message":"PRIVATE_FAILURE"}');return;}res.end(JSON.stringify({total:21,items:[article(20)]}));return;}
 if(keyword==='느린 이전'&&offset>0)await new Promise(r=>setTimeout(r,1500));
 if(keyword==='새 검색'){res.end(JSON.stringify({total:1,items:[article(100)]}));return;}
 if(keyword==='없는 검색'){res.end(JSON.stringify({total:0,items:[]}));return;}
 if(keyword==='빈 다음'){res.end(JSON.stringify({total:60,items:offset===0?batch():[]}));return;}
 if(keyword==='중복 페이지'){res.end(JSON.stringify({total:60,items:offset===0?batch():offset===20?batch():batch(20)}));return;}
 if(keyword==='재시도'){res.end(JSON.stringify({total:21,items:batch()}));return;}
 const items=offset===0?[...batch().slice(0,19),article(0)]:offset===20?[article(0),...batch(19).slice(0,19)]:offset===40?[article(38),article(38),article(39)]:[];
 res.end(JSON.stringify({total:43,items}));
}).listen(3824,'127.0.0.1',()=>console.log('pagination QA API ready'));
