const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process'),{createInterface}=require('node:readline'),{randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..'),frontend=path.join(root,'custom_components/gartenarbeit_manager/frontend');
const output=path.join(root,'test-results');fs.mkdirSync(output,{recursive:true});
const host=spawn(process.env.PYTHON||'python3',['-u',path.join(__dirname,'booking_host.py')],{stdio:['pipe','pipe','inherit']});
const tasks=new Map(),requests=[];let serial=0;
const lines=createInterface({input:host.stdout});
lines.on('line',line=>{const result=JSON.parse(line),task=tasks.get(result.id);if(!task)return;tasks.delete(result.id);if(result.error)task.reject(new Error(result.error.message));else task.resolve(result.result);});
host.on('exit',()=>{for(const task of tasks.values())task.reject(new Error('Test backend exited'));tasks.clear();});
function rpc(user,message){return new Promise((resolve,reject)=>{const id=++serial;tasks.set(id,{resolve,reject});requests.push({user,...message});host.stdin.write(JSON.stringify({user,message:{...message,id}})+'\n');});}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.method==='POST'&&req.url==='/rpc'){
   let body='';for await(const chunk of req)body+=chunk;const {user,message}=JSON.parse(body);
   if(message.entry?.reason==='Test-Speicherfehler'){res.writeHead(503,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Test: Speichern fehlgeschlagen'}));return;}
   const result=await rpc(user,message);res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(result));return;
  }
  let filename;
  if(req.url==='/')filename=path.join(__dirname,'browser/index.html');
  else if(req.url.startsWith('/gartenarbeit-manager/')){
   filename=path.resolve(frontend,decodeURIComponent(req.url.split('?')[0].slice('/gartenarbeit-manager/'.length)));
   if(!filename.startsWith(frontend+path.sep)){res.writeHead(403).end();return;}
  }
  if(!filename||!fs.existsSync(filename)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':filename.endsWith('.js')?'text/javascript':filename.endsWith('.json')?'application/json':'text/html'}).end(fs.readFileSync(filename));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}));}
});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGMMaIpiIAUwkaR6VMOohiGlAQDImwFMD5ncSQAAAABJRU5ErkJggg==','base64');
async function seed(user,kind,child,minutes,reason,photo=null){await rpc(user,{type:'gartenarbeit_manager/add',entity_id:`sensor.gartenarbeit_${child.toLowerCase()}`,revision:serial? (await rpc('v',{type:'gartenarbeit_manager/get'})).revision:0,entry:{request_id:randomUUID(),kind,child,minutes,date:'2026-11-10',reason,photo}});}
(async()=>{
 let browser,page,completed=false;
 try{
  await seed('v','assigned','Maximilian',15,'Gartenzeit zugewiesen');
  await seed('m','assigned','Paul',10,'Zusätzliche Gartenzeit');
  await seed('max','worked','Maximilian',30,'Unkraut <img src=x onerror=alert(1)> und sehr lange Gartentätigkeit '+ 'Langtext'.repeat(25));
  await seed('p','worked','Paul',20,'Laub gesammelt');
  await seed('v','correction','Paul',-25,'Vorhandenes Guthaben');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  page=await browser.newPage({viewport:{width:1100,height:1000}});page.setDefaultTimeout(10000);
  const errors=[],moduleFailures=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/family-ui/')&&r.status()!==200)moduleFailures.push(r.url());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const card=page.locator('gartenarbeit-manager-card');
  await card.locator('.balance').nth(1).waitFor();
  assert.equal(await card.locator('ha-icon').count(),0,'All UI actions use kit SVGs');
  const settings=()=>card.getByRole('button',{name:'Einstellungen',exact:true});
  const navigate=pageId=>card.locator(`[data-action="navigate"][data-page="${pageId}"]`).click();
  async function fit(){
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'The page must fit horizontally');
   const bad=await card.evaluate(el=>[...el.shadowRoot.querySelectorAll('.card-top,main,.setting-row,.settings-heading-row,.modal[open],.modal[open] .modal-body')].filter(n=>n.getClientRects().length&&n.scrollWidth>n.clientWidth+1).map(n=>({class:n.className,width:n.clientWidth,scroll:n.scrollWidth})));
   assert.deepEqual(bad,[],'Common components must fit horizontally');
  }
  for(const dark of [false,true]){
   if(dark)await page.locator('#theme').click();
   for(const width of [1100,430,390,375,320]){
    await page.setViewportSize({width,height:1000});await navigate('ledger');await fit();
    const addControl=card.locator('.page-actions .program-add');assert.equal(await addControl.textContent(),'+ Buchung');assert.equal(await addControl.locator('svg').count(),0);assert.equal(await addControl.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(3, 169, 244)');
    await page.screenshot({path:path.join(output,`ledger-${width}-${dark?'dark':'light'}.png`),fullPage:true});
    await settings().click();await fit();
    assert.match(await card.locator('.version-info').innerText(),/Oberfläche 1\.1\.1 · Integration 1\.1\.1 · UI 1\.1\.0/);
    const styles=await settings().evaluate(el=>({width:getComputedStyle(el).width,color:getComputedStyle(el).color,svg:getComputedStyle(el.querySelector('svg')).width,fill:getComputedStyle(el.querySelector('svg')).fill}));
    assert.equal(styles.width,width<=600?'42px':'48px');assert.equal(styles.svg,'24px');assert.equal(styles.color,'rgb(3, 169, 244)');assert.equal(styles.fill,styles.color);
    assert.equal(await card.locator('.row-text strong').first().evaluate(el=>getComputedStyle(el).fontSize),'13px');
    assert.equal(await card.evaluate(el=>getComputedStyle(el).fontSize),'14px');
    await page.screenshot({path:path.join(output,`settings-${width}-${dark?'dark':'light'}.png`),fullPage:true});
   }
  }
  // Settings folding and navigation retain their state across refresh/render.
  const fold=card.getByRole('button',{name:'Benutzer & Rechte',exact:true});await fold.focus();await fold.press('Space');assert.equal(await fold.getAttribute('aria-expanded'),'false');
  await navigate('ledger');await settings().click();assert.equal(await card.getByRole('button',{name:'Benutzer & Rechte',exact:true}).getAttribute('aria-expanded'),'false');
  // All forms use the kit modal, and the footer submit button is natively associated with its form.
  const correction=card.getByRole('button',{name:'Zeitkonto korrigieren',exact:true});await correction.click();
  let modal=card.getByRole('dialog');await modal.waitFor();console.log('Correction labels:',await modal.locator('label').allTextContents());await modal.getByLabel(/^Kind/).selectOption('Paul');await modal.getByLabel('+ zuweisen / − gutschreiben',{exact:true}).fill('0');await modal.getByLabel('Grund der Korrektur',{exact:true}).fill('Freie Korrektur im Browser');
  assert.equal(await modal.locator('[type=submit]').evaluate(el=>el.form?.id),'gm-booking-form');
  await modal.locator('[type=submit]').click();assert.match(await modal.locator('.form-error').innerText(),/außer 0/);
  await modal.locator('[data-correction-minutes="-15"]').click();assert.equal(await modal.locator('[name=minutes]').inputValue(),'-15');
  await modal.locator('[name=minutes]').fill('-37');await fit();
  for(let i=0;i<10;i++){await page.keyboard.press('Tab');assert.equal(await modal.evaluate(el=>el.contains(el.getRootNode().activeElement)),true,'Focus stays in the kit modal');}
  await page.screenshot({path:path.join(output,'correction-320-dark.png'),fullPage:true});
  await modal.locator('[type=submit]').click();await modal.waitFor({state:'detached'});
  await navigate('ledger');assert.match(await card.locator('.balance').filter({hasText:'Paul'}).innerText(),/52 min Guthaben/);
  assert.equal(await card.locator('.entry img').count(),0,'Descriptions remain escaped');
  // Cancel and Escape return focus to the still-mounted kit opener.
  const add=card.locator('[data-action=book]').first();await add.click();modal=card.getByRole('dialog');await modal.locator('[name=reason]').fill('Nicht speichern');await page.keyboard.press('Escape');await modal.waitFor({state:'detached'});assert.equal(await add.evaluate(el=>el.getRootNode().activeElement===el),true);
  // A storage failure keeps all inputs and re-enables the actual footer button.
  await add.click();modal=card.getByRole('dialog');await modal.locator('[name=reason]').fill('Test-Speicherfehler');await modal.locator('[type=submit]').click();await modal.locator('.form-error').filter({hasText:'Speichern fehlgeschlagen'}).waitFor();assert.equal(await modal.locator('[name=reason]').inputValue(),'Test-Speicherfehler');assert.equal(await modal.locator('[type=submit]').isEnabled(),true);await modal.getByRole('button',{name:'Abbrechen',exact:true}).click();
  // Child view: own account, own pending reports, no parental controls.
  await page.locator('#person').selectOption('max');await card.locator('.balance').filter({hasText:'Maximilian'}).waitFor();assert.equal(await card.locator('.balance').count(),1);assert.equal(await card.locator('[data-page=approvals]').count(),0);
  await settings().click();assert.equal(await card.locator('[data-book=correction]').count(),0);await navigate('ledger');
  await card.locator('[data-book=worked]').click();modal=card.getByRole('dialog');assert.equal(await modal.locator('[name=child]').count(),0);assert.equal(await modal.locator('[name=kind]').count(),0);
  await modal.locator('[name=minutes]').fill('17');await modal.locator('[name=reason]').fill('Neue Gartenarbeit');
  await modal.locator('[data-file]').setInputFiles({name:'garden.png',mimeType:'image/png',buffer:png});await modal.locator('.photo-preview').waitFor();
  await card.evaluate(el=>el.load());assert.equal(await modal.locator('[name=reason]').inputValue(),'Neue Gartenarbeit');
  await fit();await page.screenshot({path:path.join(output,'report-320-dark.png'),fullPage:true});
  await modal.locator('[type=submit]').click();await modal.waitFor({state:'detached'});
  let work=card.locator('.entry').filter({hasText:'Neue Gartenarbeit'});await work.waitFor();await work.locator('[data-ui=collapse]').first().click();await work.getByRole('button',{name:'Bearbeiten',exact:true}).click();modal=card.getByRole('dialog');assert.equal(await modal.locator('[name=minutes]').inputValue(),'17');await modal.locator('[name=minutes]').fill('19');await modal.locator('[type=submit]').click();await modal.waitFor({state:'detached'});
  await assert.rejects(()=>rpc('max',{type:'gartenarbeit_manager/add',entity_id:'sensor.gartenarbeit_paul',revision:999,entry:{request_id:randomUUID(),child:'Paul',kind:'worked',minutes:5,date:'2026-11-10',reason:'Foreign account'}}));
  const maxSnapshot=await rpc('max',{type:'gartenarbeit_manager/get'});await assert.rejects(()=>rpc('max',{type:'gartenarbeit_manager/add',entity_id:'sensor.gartenarbeit_maximilian',revision:maxSnapshot.revision,entry:{request_id:randomUUID(),child:'Maximilian',kind:'correction',minutes:-5,date:'2026-11-10',reason:'Forbidden correction'}}));
  // Parent approves adjusted minutes and can still view the uploaded photo.
  await page.locator('#person').selectOption('v');await card.locator('.balance').nth(1).waitFor();await navigate('approvals');work=card.locator('.entry').filter({hasText:'Neue Gartenarbeit'});await work.locator('[data-ui=collapse]').first().click();await work.getByRole('button',{name:'Prüfen & freigeben',exact:true}).click();modal=card.getByRole('dialog');assert.equal(await modal.locator('[name=minutes]').inputValue(),'19');await modal.getByRole('button',{name:'Foto ansehen',exact:true}).click();await modal.locator('.photo-preview').waitFor();await modal.locator('[name=minutes]').fill('13');await fit();await page.screenshot({path:path.join(output,'approval-320-dark.png'),fullPage:true});await modal.locator('[type=submit]').click();await modal.waitFor({state:'detached'});
  await navigate('ledger');assert.match(await card.locator('.balance').filter({hasText:'Maximilian'}).innerText(),/2 min offen/);
  assert.deepEqual(errors,[]);assert.deepEqual(moduleFailures,[]);
  assert.ok(requests.filter(r=>/\/(add|update|approve)$/.test(r.type)).every(r=>r.entity_id?.startsWith('sensor.gartenarbeit_')));
  fs.writeFileSync(path.join(output,'validation.json'),JSON.stringify({version:'1.1.1',uiKit:'1.1.0',widths:[1100,430,390,375,320],themes:['light','dark'],checked:['real ES modules and static files','shared SVGs and typography','responsive overflow','native form submit','signed correction and presets','child report and edit','photo upload and approval','role denials','adjusted approval','storage failure recovery','open form preservation','keyboard, focus and Escape'],pageErrors:errors},null,2));
  completed=true;console.log('Browser checks passed: desktop/mobile 1100/430/390/375/320, light/dark, native forms, real adapter writes, photos, roles, errors and keyboard.');
 }finally{if(page&&!completed){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});const diagnostic=await page.locator('gartenarbeit-manager-card').evaluate(el=>({markup:el.shadowRoot.innerHTML,tab:el._tab,data:el._data,parent:el._data?.parent})).catch(e=>({error:e.message}));fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(diagnostic,null,2));console.error('Browser failure diagnostic:',JSON.stringify({tab:diagnostic.tab,parent:diagnostic.parent,entries:diagnostic.data?.entries?.length,markupSaved:'failure.json'}));}if(browser)await browser.close();server.close();lines.close();host.stdin.end();host.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
