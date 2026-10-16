import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const app=process.cwd(),req=createRequire(app+'/package.json'),{chromium}=req('playwright-core');
const out='/tmp/reading-experience-browser';await mkdir(out,{recursive:true});
const origin='https://poem-news.168.107.37.12.sslip.io',base='http://localhost:3000';
const report={success:false,checks:[],geometry:[],requests:[],errors:[],reportFixturePosts:0,liveReads:0,externalWrites:0};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let mode='fixture',hold=null,failNext=false,holdNext=false,api,server,browser;
let release=()=>{};let held=false;
const item=(i)=>({article_id:i.toString(16).padStart(64,'0'),collection_id:'local-qa',
 image_status:'disabled',image_url:null,article:{title:'AI 안전 보도 '+i+' — 서울 지역의 교통·생활 안전 소식',description:'실제 API 계약과 동일한 로컬 검증 데이터입니다. 좁은 화면에서 제목, 본문, 날짜와 원문 링크의 간격을 점검합니다.',pubDate:new Date(Date.now()-i*60000).toISOString(),originallink:'https://example.invalid/news/'+i,link:''},
 location_status:'resolved',location_reason:null,location:{label:'서울특별시 중구',latitude:37.56+(i%3)*.015,longitude:126.99+(i%3)*.015,precision:'region',evidence:{field:'description',text:'서울특별시 중구'}}});
const rows=[...Array.from({length:19},(_,i)=>item(i)),item(0),...Array.from({length:21},(_,i)=>item(i+19))];
function armHold(target={}){holdNext=target;held=false;hold=new Promise(r=>{release=r;});}
function matchesHold(u,offset){return holdNext&&(!('path'in holdNext)||holdNext.path===u.pathname)&&(!('q'in holdNext)||holdNext.q===u.searchParams.get('keyword'))&&(!('offset'in holdNext)||holdNext.offset===offset);}
async function stop(child){if(!child||child.exitCode!==null)return;const ended=once(child,'exit');child.kill('SIGTERM');await Promise.race([ended,wait(2000)]);if(child.exitCode===null)child.kill('SIGKILL');}
async function snap(page,name,fullPage=false){await page.screenshot({path:out+'/'+name+'.png',fullPage,animations:'disabled'});}
async function goto(page,path){await page.goto(base+path,{waitUntil:'networkidle'});}
async function until(page,callback,arg){await page.waitForFunction(callback,arg,{timeout:10000});}
async function geometry(page,path,width){
 const metric=await page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
  const nav=document.querySelector('nav[aria-label="주 메뉴"]'),links=nav?[...nav.querySelectorAll('a')]:[],f=document.querySelector('form[action="/search"]');
  const form=f?box(f):null,control=f?box(f.querySelector('button')):null;
  return{overflow:document.documentElement.scrollWidth>innerWidth,form,control,nav:nav?box(nav):null,tabs:links.map(box),article:[...document.querySelectorAll('article')].slice(0,3).map(box)};
 });
 assert.equal(metric.overflow,false,'horizontal overflow '+path+'/'+width);
 if(metric.form){assert(metric.form.h>=44);assert(metric.control.h>=44);assert(metric.control.y>=metric.form.y);assert(metric.control.bottom<=metric.form.bottom);}
 if(metric.tabs.length){assert(metric.tabs[1].x-metric.tabs[0].right>=8);assert(metric.tabs[2].x-metric.tabs[1].right>=8);}
 report.geometry.push({path,width,...metric});
}
try{
 api=createServer(async(request,response)=>{try{
  if(request.method!=='GET'){report.externalWrites++;response.writeHead(405).end();return;}
  const u=new URL(request.url,'http://fixture');
  if(mode==='live'){report.liveReads++;const r=await fetch(origin+u.pathname+u.search);response.writeHead(r.status,{'Content-Type':r.headers.get('content-type')??'application/json'});response.end(Buffer.from(await r.arrayBuffer()));return;}
  if(u.pathname==='/news'||u.pathname.startsWith('/news/')){
   const offset=Number(u.searchParams.get('offset')??0);report.requests.push({path:u.pathname,q:u.searchParams.get('keyword'),offset});
   const wasHeld=matchesHold(u,offset);if(wasHeld){holdNext=false;held=true;await hold;}
   if(failNext&&wasHeld){failNext=false;response.writeHead(503).end('{}');return;}
   response.setHeader('Content-Type','application/json');
   if(u.pathname.startsWith('/news/')){response.end(JSON.stringify(rows[0]));return;}
   response.end(JSON.stringify({total:rows.length,items:rows.slice(offset,offset+20)}));return;
  }
  response.setHeader('Content-Type','application/json');
  if(u.pathname==='/map/articles'){response.end(JSON.stringify({total:3,items:rows.slice(0,3)}));return;}
  response.writeHead(404).end('{}');
 }catch(e){response.writeHead(502).end('{}');}});
 await new Promise((r,j)=>{api.once('error',j);api.listen(4201,'127.0.0.1',r);});
 server=spawn(process.execPath,[req.resolve('next/dist/bin/next'),'start','--hostname','localhost','--port','3000'],{cwd:app,env:{...process.env,NEWS_API_BASE_URL:'http://127.0.0.1:4201',NEXT_PUBLIC_NAVER_MAP_CLIENT_ID:'3p2jip9u35',NEXT_PUBLIC_REPORT_API_BASE_URL:'https://reports.example.invalid',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
 let log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
 for(let i=0;i<150&&!log.includes('Ready');i++){assert.equal(server.exitCode,null,log);await wait(100);}assert(log.includes('Ready'),log);
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:393,height:852}});
 page.on('pageerror',e=>report.errors.push(e.message));
 // Delay the real SDK script to inspect the dedicated map spinner.
 let releaseSdk;const sdkGate=new Promise(r=>releaseSdk=r);
 const sdkRoute=async route=>{await sdkGate;await route.continue();};
 await page.route('**/openapi/v3/maps.js**',sdkRoute);
 const mapNavigation=page.goto(base+'/',{waitUntil:'domcontentloaded'});
 const mapLoading=page.locator('main [role="status"][aria-busy="true"]').first();
 await mapLoading.waitFor({state:'visible',timeout:8000});
 assert((await mapLoading.locator('svg[aria-hidden="true"]').count())>0);
 await snap(page,'map-sdk-loading');releaseSdk();await mapNavigation;await page.unroute('**/openapi/v3/maps.js**',sdkRoute);
 await page.waitForFunction(()=>!document.querySelector('button[aria-label="내 위치"]')?.disabled);
 await page.evaluate(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:success=>{window.__finishLocation=success;}}}));
 await page.getByRole('button',{name:'내 위치',exact:true}).click();
 const locating=page.getByRole('button',{name:'내 위치',exact:true});
 assert.equal(await locating.getAttribute('aria-busy'),'true');
 assert((await locating.locator('svg[aria-hidden="true"]').count())>0);
 await snap(page,'map-locating');
 await page.evaluate(()=>window.__finishLocation({coords:{latitude:37.56,longitude:126.99,accuracy:30}}));
 await page.waitForFunction(()=>document.querySelector('button[aria-label="내 위치"]')?.getAttribute('aria-busy')!=='true');
 report.checks.push('실제 지도 SDK 준비·위치 요청: 접근 가능한 spinner, 위치는 로컬 fixture로만 전달');

 for(const width of [320,393,640,1440]){
  await page.setViewportSize({width,height:852});
  for(const path of ['/search','/incidents','/report','/incidents/'+rows[0].article_id,'/']){
   await goto(page,path);await geometry(page,path,width);
   await snap(page,width+'-'+(path==='/'?'map':path.startsWith('/incidents/')?'detail':path.slice(1)));
  }
 }
 await page.setViewportSize({width:393,height:852});
 await goto(page,'/search');
 for(const name of ['지도','제보하기','목록']){
  const link=name==='제보하기'?page.getByRole('link',{name,exact:true}):page.locator('nav[aria-label="주 메뉴"]').getByRole('link',{name,exact:true});
  await link.focus();
  const focus=await link.evaluate(el=>{const c=getComputedStyle(el);return{style:c.outlineStyle,width:parseFloat(c.outlineWidth)};});
  assert(focus.style!=='none'&&focus.width>0,'focus remains visible '+name);
 }
 await snap(page,'nav-keyboard-focus');
 report.checks.push('320/393/640/1440 지도·검색·목록·상세·제보: 가로 넘침 없음, 검색44px 컨트롤 포함, 내비 간격8px 이상 및 키보드 포커스 유지');
 // Held initial response exposes real App Router skeletons.
 for(const [path,label] of [['/incidents','사건을 불러오는 중'],['/search?q=초기','검색 결과를 불러오는 중'],['/incidents/'+rows[0].article_id,'기사를 불러오는 중']]){
  armHold(path.startsWith('/search')?{path:'/news',q:'초기',offset:0}:{path:path==='/incidents'?'/news':'/news/'+rows[0].article_id,q:null,offset:0});const navigation=page.goto(base+path,{waitUntil:'domcontentloaded'});
  const loading=page.locator('[role="status"][aria-busy="true"]').filter({hasText:label});
  await loading.waitFor({state:'visible',timeout:8000});
  assert((await loading.locator('[aria-hidden="true"]').count())>0);
  await snap(page,'initial-'+(path.startsWith('/search')?'search':path.includes(rows[0].article_id)?'detail':'list'));
  release();await navigation;await page.locator('article').first().waitFor();
 }
 report.checks.push('실제 App Router의 목록·검색·상세 초기 응답 보류: 카드/본문 skeleton과 접근성 상태');
 // No automatic retry loop on a failed additional request. Raw offsets include duplicate rows.
 for(const path of ['/incidents','/search?q=AI']){
  report.requests.length=0;await goto(page,path);await page.locator('article').first().waitFor();
  assert.equal(await page.locator('article').count(),19);
  const expectedQ=path.startsWith('/search')?'AI':null;const relevant=()=>report.requests.filter(r=>r.path==='/news'&&r.q===expectedQ);
  armHold({path:'/news',q:expectedQ,offset:20});failNext=true;
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await until(page,()=>!!document.querySelector('[role="status"][aria-busy="true"]'));
  assert(held);assert.equal(await page.locator('article').count(),19);
  await snap(page,(path.startsWith('/search')?'search':'list')+'-append-pending');
  release();await page.getByRole('button',{name:'다시 시도',exact:true}).waitFor();
  const failedRequests=relevant().length;await wait(500);await page.evaluate(()=>window.dispatchEvent(new Event('scroll')));await wait(200);
  assert.equal(relevant().length,failedRequests);
  await snap(page,(path.startsWith('/search')?'search':'list')+'-append-error');
  const retry=page.getByRole('button',{name:'다시 시도',exact:true});
  await retry.focus();armHold({path:'/news',q:expectedQ,offset:20});await retry.press('Enter');
  await until(page,()=>!!document.querySelector('[role="status"][aria-busy="true"]'));
  report.geometry.push({path,retryFocusWhilePending:await page.evaluate(()=>document.activeElement?.tagName==='BUTTON'&&document.activeElement?.textContent?.includes('다시 시도'))});
  await snap(page,(path.startsWith('/search')?'search':'list')+'-retry-pending');release();
  await until(page,()=>document.querySelectorAll('article').length>=39);
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await until(page,()=>document.querySelectorAll('article').length===40);
  assert.deepEqual(relevant().map(r=>r.offset),[0,20,20,40]);
  const finished=relevant().length;await page.evaluate(()=>window.dispatchEvent(new Event('scroll')));await wait(300);assert.equal(relevant().length,finished);
  assert.equal(await page.getByRole('button',{name:'더 보기',exact:true}).count(),0);
  await snap(page,(path.startsWith('/search')?'search':'list')+'-end');
 }
 report.checks.push('검색/목록 실제 스크롤: 기존19카드 유지+추가 skeleton, 503 자동 재시도 멈춤, 수동 복구, offset0/20/20/40·고유40개, 종료 뒤 요청 없음');
 // Actual next/link pending indicator remains compact.
 armHold({path:'/news',q:'교통통제',offset:0});await page.goto(base+'/search',{waitUntil:'load'});
 const keyword=page.getByRole('link',{name:/교통통제/});const before=await keyword.boundingBox();
 await keyword.click();
 const pending=page.getByRole('status').filter({hasText:/검색.*불러/});await pending.waitFor();
 const after=await keyword.boundingBox();assert(Math.abs(before.width-after.width)<1);assert(Math.abs(before.height-after.height)<1);
 assert.equal(await pending.locator('svg[aria-hidden="true"]').count(),1);
 await snap(page,'keyword-pending');
 await page.emulateMedia({reducedMotion:'reduce'});await wait(200);
 const animations=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);assert.equal(animations,0);
 await snap(page,'keyword-pending-reduced-motion');
 release();await page.waitForURL(u=>u.searchParams.get('q')==='교통통제');await page.emulateMedia({reducedMotion:'no-preference'});
 report.checks.push('실제 next/link pending: 칩 크기 변화1px 미만·spinner, reduced-motion 시 실행 애니메이션0');

 // Short recording shows loading motion without relying on text-only evidence.
 const motionContext=await browser.newContext({viewport:{width:393,height:852},recordVideo:{dir:out+'/video',size:{width:393,height:852}}});
 const motionPage=await motionContext.newPage();armHold({path:'/news',q:'교통통제',offset:0});await motionPage.goto(base+'/search',{waitUntil:'load'});
 await motionPage.getByRole('link',{name:/교통통제/}).click();
 await motionPage.locator('[role="status"][aria-busy="true"]').waitFor();await wait(1200);release();
 await motionPage.waitForURL(u=>u.searchParams.get('q')==='교통통제');await wait(600);
 await motionContext.close();

 // Report POST is intercepted locally; nothing reaches any external service.
 await page.route('https://reports.example.invalid/**',async route=>{
  if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':base,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Idempotency-Key,Content-Type'}});return;}
  report.reportFixturePosts++;held=true;await hold;await route.fulfill({status:201,contentType:'application/json',headers:{'Access-Control-Allow-Origin':base},body:JSON.stringify({report_id:'a'.repeat(32),status:'pending',received_at:new Date().toISOString()})});
 });
 await goto(page,'/report');
 await page.getByLabel('카테고리 선택').selectOption('society');
 await page.getByLabel('발생 날짜 및 시간 (한국시간)').fill('2026-10-16T12:00');
 await page.getByLabel('제보 제목').fill('로컬 브라우저 검증');
 await page.getByLabel('발생 위치',{exact:true}).fill('서울특별시 중구');
 await page.getByLabel('상세내용').fill('로컬 fixture로만 전송을 검증합니다.');
 armHold({path:'/never-match-report'});await page.getByRole('button',{name:'제보 접수',exact:true}).click();
 const submit=page.getByRole('button',{name:/접수 중/});await submit.waitFor();
 assert(await submit.isDisabled());assert((await submit.locator('svg').count())>0);
 await snap(page,'report-submit-pending');release();await page.getByRole('status').filter({hasText:'제보가 접수됐어요'}).waitFor();
 report.checks.push('제보 접수 로컬 fixture만 사용: spinner·버튼 크기/잠금·접수 완료, 외부 POST0');
 // Real read-only API screenshots supplement controlled loading fixtures.
 mode='live';const live=await fetch(origin+'/news?limit=20&offset=0').then(r=>r.json());const first=live.items[0]?.article_id;
 for(const [name,path] of [['map','/'],['search','/search'],['results','/search?q='+encodeURIComponent('화재')],['list','/incidents'],...(first?[['detail','/incidents/'+first]]:[])]){
  await goto(page,path);await snap(page,'live-'+name);
 }
 await page.setViewportSize({width:667,height:375});await goto(page,'/');await geometry(page,'/',667);await snap(page,'map-landscape');
 assert.equal(report.externalWrites,0);assert.deepEqual(report.errors,[]);
 assert(report.geometry.filter(m=>'retryFocusWhilePending'in m).every(m=>m.retryFocusWhilePending),'keyboard retry focus must remain on the pending retry control');
 report.success=true;
}catch(e){report.failure=e.stack;throw e;}
finally{
 release();await writeFile(out+'/report.json',JSON.stringify(report,null,2));
 await browser?.close();await stop(server);api?.closeAllConnections();if(api)await new Promise(r=>api.close(r));
 console.log(JSON.stringify(report));
}