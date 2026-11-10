// Exercise the real card's submit/mutate path against the Python HA adapter.
// Only browser DOM and HA runtime/storage surfaces are simulated.
const assert=require('node:assert/strict'),path=require('node:path');
const {spawn}=require('node:child_process'),{createInterface}=require('node:readline');
const {parseHTML}=require('linkedom');
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

async function bookings(localHttp){
 const host=spawn(process.env.PYTHON||'python3',['-u',path.join(__dirname,'booking_host.py')],{stdio:['pipe','pipe','inherit']});
 const waiting=new Map(),requests=[];let nextId=0;
 const lines=createInterface({input:host.stdout});
 lines.on('line',line=>{const reply=JSON.parse(line),task=waiting.get(reply.id);if(!task)return;waiting.delete(reply.id);if(reply.error)task.reject(new Error(reply.error.message));else task.resolve(reply.result);});
 host.on('error',err=>{for(const task of waiting.values())task.reject(err);waiting.clear();});
 host.on('exit',()=>{for(const task of waiting.values())task.reject(new Error('Booking test host exited'));waiting.clear();});
 const timeout=setTimeout(()=>host.kill(),15000),cards=[];
 function send(user,message,reload=false){return new Promise((resolve,reject)=>{const id=++nextId;requests.push({user,...message});waiting.set(id,{resolve,reject});host.stdin.write(JSON.stringify({user,message:{...message,id},reload})+'\n');});}
 try{
 const {window}=parseHTML('<html><body></body></html>');
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','')};
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'))};
 Object.defineProperty(window.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open')}});
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return (this.querySelector('option[selected]')||this.querySelector('option'))?.value||''},set(v){this.querySelectorAll('option').forEach(o=>o.toggleAttribute('selected',o.value===String(v)))}});
 const Card=await require('./card_runtime.cjs').loadCard(window,{localHttp});
 async function create(user){const card=new Card();card.setConfig({});window.document.body.append(card);cards.push(card);card._user=user;card._hass={callWS:message=>send(user,message)};await card.load();assert.ok(card._data);return card;}
 function field(card,name,value){const input=card.shadowRoot.querySelector(`[name="${name}"]`);assert.ok(input,name);input.value=String(value);}
 async function submit(card){const form=card.shadowRoot.querySelector('dialog form');assert.equal(typeof form.onsubmit,'function','The form must have a save handler');form.onsubmit({preventDefault(){}});while(card._busy)await new Promise(resolve=>setImmediate(resolve));}
 const balance=(card,child)=>card._data.balances.find(b=>b.child===child);
  const max=await create('max'),parent=await create('v');
  max.edit();field(max,'minutes',17);field(max,'reason','Hecke gepflegt');await submit(max);
  assert.equal(max.shadowRoot.querySelector('dialog'),null);assert.equal(balance(max,'Maximilian').pending,17);assert.equal(balance(max,'Maximilian').remaining,0);
  await parent.load();parent.edit(null,'correction');field(parent,'child','Maximilian');field(parent,'minutes',-37);field(parent,'reason','Freie Elternkorrektur');await submit(parent);
  assert.equal(balance(parent,'Maximilian').remaining,-37);assert.equal(balance(parent,'Maximilian').pending,17);
  const correction=parent._data.entries.find(e=>e.kind==='correction');parent.edit(correction);field(parent,'minutes',23);await submit(parent);
  assert.equal(balance(parent,'Maximilian').remaining,23);assert.equal(parent._data.entries.find(e=>e.id===correction.id).history[0].before.minutes,-37);
  const work=parent._data.entries.find(e=>e.kind==='worked');parent.review(work);field(parent,'minutes',15);await submit(parent);
  assert.equal(balance(parent,'Maximilian').remaining,8);assert.equal(balance(parent,'Maximilian').pending,0);
  await max.load();assert.equal(max._data.entries.find(e=>e.id===work.id).can_edit,false);
  // The first write succeeds but its response is lost. Reusing the open form must not double-book.
  let loseResponse=true;max._hass.callWS=async message=>{const result=await send('max',message);if(loseResponse&&message.type.endsWith('/add')){loseResponse=false;throw new Error('Antwort verloren');}return result;};
  max.edit();field(max,'minutes',19);field(max,'reason','Verlorene Antwort');await submit(max);
  assert.match(max.shadowRoot.querySelector('.form-error').textContent,/Antwort verloren/);assert.equal(max.shadowRoot.querySelector('[name="reason"]').value,'Verlorene Antwort');await submit(max);
  assert.equal(max.shadowRoot.querySelector('dialog'),null);assert.equal(max._data.entries.filter(e=>e.reason==='Verlorene Antwort').length,1);
  const afterReload=await send('v',{type:'gartenarbeit_manager/get'},true);
  assert.equal(afterReload.entries.length,3);assert.equal(afterReload.balances.find(b=>b.child==='Maximilian').remaining,8);assert.equal(afterReload.balances.find(b=>b.child==='Maximilian').pending,19);
  const ids=requests.filter(r=>r.type.endsWith('/add')).map(r=>r.entry.request_id);assert.ok(ids.every(id=>uuid.test(id)));assert.equal(new Set(ids).size,3);assert.equal(ids.at(-1),ids.at(-2));
  assert.ok(requests.filter(r=>/\/(add|update|approve)$/.test(r.type)).every(r=>r.entity_id==='sensor.gartenarbeit_maximilian'),'Every mutation must name the affected account entity');
  console.log(`Booking path passed (${localHttp?'local HTTP without randomUUID':'HTTPS/Cloud crypto'}): child report, signed parent correction, editing, approval, lost response retry, UUID format and reload.`);
 }finally{for(const card of cards)card.remove();clearTimeout(timeout);lines.close();host.stdin.end();host.kill();}
}
(async()=>{await bookings(true);await bookings(false);})().catch(err=>{console.error(err);process.exitCode=1});
