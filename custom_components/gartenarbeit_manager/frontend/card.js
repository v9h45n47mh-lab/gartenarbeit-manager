/* Gartenarbeit Manager 1.1.1 — pinned, locally bundled HA UI Kit. */
import {
  UI_CSS, UI_VERSION, escapeHtml as gmEsc, button, iconButton, navigation, programAddButton,
  section, row, field, selectField, dialog as uiDialog, notice, versionInfo, bindUI,
} from './family-ui/1.1.0/family-ui.js';

const GM_VERSION='1.1.1';
// getRandomValues also works on local HTTP origins, where randomUUID is unavailable.
const gmRequestId=()=>{const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;};
const gmDate=day=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(day+'T12:00:00'));
const gmTime=value=>new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
// Domain arrangement only. Shared controls, icons, colours and typography use UI_CSS unchanged.
const GM_LAYOUT=`.gm-form{display:grid;gap:16px}.gm-photo-box{display:grid;gap:8px}.gm-presets{margin-top:8px}.form-error:empty{display:none}.photo-preview{display:block;max-width:100%;max-height:300px;object-fit:contain;margin:auto}.gm-photo-view img{display:block;width:100%;max-height:70dvh;object-fit:contain}.gm-balance-value{white-space:nowrap}.gm-entry-content{overflow-wrap:anywhere}`;
function gmField({name,label,value='',type='text',required=false,min,max,step}) {
  const attrs=[`name="${gmEsc(name)}"`,...Object.entries({min,max,step}).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}="${gmEsc(v)}"`)];
  return field({id:`gm-${name}`,label,value,type,required}).replace('<input ',`<input ${attrs.join(' ')} `);
}
function gmSelect({name,label,value,options,marker=''}) {
  return selectField({id:`gm-${name}`,label,value,options}).replace('<select ',`<select name="${gmEsc(name)}"${marker?` data-${marker}`:''} `);
}
const gmButton=(label,action,data={},options={})=>button({label,action,data,...options});

class GartenarbeitManagerCard extends HTMLElement {
  constructor() {
    super();this.attachShadow({mode:'open'});
    this._tab='ledger';this._filter='all';this._status='all';this._busy=false;this._loading=false;
    this._seq=0;this._error='';this._notice='';this._expanded=new Set();this._folds=new Map();this._visibleCount=100;
  }
  setConfig(config){this._config={title:'Gartenarbeit',...config};this.render();}
  static getStubConfig(){return {title:'Gartenarbeit'};}
  getCardSize(){return 7;}
  set hass(hass){this._hass=hass;const user=hass.user?.id;if(user!==this._user){this._seq++;this._user=user;this._data=null;this._tab='ledger';this._filter='all';this._status='all';this._expanded.clear();this._folds.clear();this._loading=false;this.render();this.load();}else if(!this._data&&!this._loading)this.load();}
  connectedCallback() {
    this._unbindUI ||= bindUI(this.shadowRoot,event=>this.onAction(event));
    if(!this._foldListener){
      this._foldListener=e=>{const control=e.target.closest?.('[data-ui="collapse"]');if(!control||control.disabled)return;const id=control.closest('[data-settings]')?.dataset.settings;if(id)this._folds.set(id,control.getAttribute('aria-expanded')==='true');};
      this.shadowRoot.addEventListener('click',this._foldListener);
    }
    if(!this._timer)this._timer=setInterval(()=>{if(document.visibilityState!=='hidden')this.load();},15000);
    if(this._hass)this.load();
    if(!this._touchBound){this._touchBound=true;this.addEventListener('touchstart',e=>{this._touchStart=(window.scrollY<=0&&!this.shadowRoot.querySelector('dialog[open]'))?e.touches[0]?.clientY:null;},{passive:true});this.addEventListener('touchend',e=>{if(this._touchStart!==null&&e.changedTouches[0]?.clientY-this._touchStart>85)this.load();this._touchStart=null;},{passive:true});}
  }
  disconnectedCallback(){clearInterval(this._timer);this._timer=null;this._seq++;this._loading=false;this._unbindUI?.();this._unbindUI=null;if(this._foldListener)this.shadowRoot.removeEventListener('click',this._foldListener);this._foldListener=null;}
  onAction({action,data}) {
    if(this._busy)return;
    if(action==='navigate'){this._tab=data.page;this._notice='';this.render();}
    else if(action==='book')this.edit(null,data.book);
    else if(action==='edit')this.edit(this._data.entries.find(r=>r.id===data.edit));
    else if(action==='review')this.review(this._data.entries.find(r=>r.id===data.review));
    else if(action==='photo')this.showPhoto(data.photo);
    else if(action==='retry')this.load();
    else if(action==='more'){this._visibleCount+=100;this.render();}
    else if(action==='cancel')this.shadowRoot.querySelector('dialog[open]')?.close();
  }
  block(props){return section({...props,expanded:this._folds.get(props.id)??props.expanded??true});}
  balances() {
    const content=this._data.balances.map(b=>row({title:b.child,description:`Zugewiesen ${b.assigned} · Erledigt ${b.worked}${b.corrections?` · Korrektur ${b.corrections>0?'+':''}${b.corrections} min`:''}${b.pending?` · ${b.pending} min warten auf Freigabe`:''}`,trailing:`<span class="amount gm-balance-value ${b.remaining<0?'credit':''}">${Math.abs(b.remaining)} min ${b.remaining<0?'Guthaben':'offen'}</span>`}).replace('class="setting-row"','class="setting-row balance"')).join('');
    return this.block({id:'gm-balances',title:this._data.balances.length===1?'Dein Zeitkonto':'Zeitkonten',content}).replace('class="settings-group"','class="settings-group balances"');
  }
  entries() {
    const d=this._data;
    const entries=d.entries.filter(r=>(this._filter==='all'||r.child===this._filter)&&(this._tab==='approvals'?r.can_approve:this._status==='all'||r.review_status===this._status));
    const count=Math.min(entries.length,this._visibleCount);
    if(!count)return `<p class="hint empty">${this._tab==='approvals'?'Keine Gartenarbeit wartet auf Freigabe.':'Keine Buchungen in dieser Ansicht.'}</p>`;
    return entries.slice(0,count).map(r=>{
      const pending=r.review_status==='pending',label=r.kind==='worked'?(pending?'Gemeldet':'Freigegeben'):r.kind==='correction'?'Korrektur':'Zugewiesen';
      const actions=(r.can_approve?iconButton({icon:'success',label:'Prüfen & freigeben',action:'review',data:{review:r.id}}):'')+(r.photo?gmButton('Foto','photo',{photo:r.id}):'')+(r.can_edit?iconButton({icon:'edit',label:'Bearbeiten',action:'edit',data:{edit:r.id}}):'');
      let content=row({title:label,description:`${d.parent?r.child+' · ':''}${gmDate(r.date)}`,trailing:actions});
      content+=row({title:`Erfasst von ${r.actor_name}`,description:gmTime(r.created_at)});
      if(pending)content+=notice('Wartet auf Freigabe; noch nicht im Zeitkonto verrechnet.');
      if(r.reviewed_by)content+=row({title:`Freigegeben von ${r.reviewed_by}`,description:gmTime(r.reviewed_at)});
      if(r.reported_minutes!=null)content+=row({title:`Gemeldet: ${r.reported_minutes} Minuten`,description:pending?'Wartet auf Prüfung':`Angerechnet: ${-r.minutes} Minuten`});
      if(r.history?.length)content+=this.block({id:`gm-history-${r.id}`,title:`Änderungsverlauf (${r.history.length})`,expanded:false,content:r.history.map(h=>row({title:`${h.action==='approved'?'Freigegeben':'Bearbeitet'} von ${h.by}`,description:`${gmTime(h.at)} · Vorher: ${h.before.minutes} min · ${gmDate(h.before.date)} · ${h.before.reason}`})).join('')});
      return this.block({id:`gm-entry-${r.id}`,title:r.reason,expanded:false,trailing:`<small class="minutes">${pending?Math.abs(r.minutes):(r.minutes>0?'+':'')+r.minutes} min</small>`,content:`<div class="gm-entry-content">${content}</div>`}).replace('class="settings-group"',`class="settings-group entry" data-row="${gmEsc(r.id)}"`);
    }).join('')+(entries.length>count?gmButton(`Weitere ${Math.min(100,entries.length-count)} Buchungen anzeigen`,'more'):'');
  }
  settings() {
    let account=row({title:'Offene Minuten und Guthaben',description:'Positive Werte sind offene Gartenminuten. Negative Werte sind Guthaben. Gemeldete Arbeit zählt erst nach Freigabe.'});
    if(this._data.parent){account+=row({title:'Gartenzeit zuweisen',description:'5, 10 oder 15 Minuten',trailing:iconButton({icon:'add',label:'Gartenzeit zuweisen',action:'book',data:{book:'assigned'}})});account+=row({title:'Zeitkonto korrigieren',description:'Freie positive oder negative Minuten',trailing:iconButton({icon:'edit',label:'Zeitkonto korrigieren',action:'book',data:{book:'correction'}})});}
    const users=row({title:`Angemeldet als ${this._data.person}`,description:this._data.parent?'Vera und Manuel dürfen zuweisen, korrigieren, bearbeiten und freigeben.':'Du siehst dein eigenes Zeitkonto und kannst eigene Meldungen bis zur Freigabe bearbeiten.'})+row({title:'Benutzerzuordnung',description:'Als HA-Administrator unter Einstellungen → Geräte & Dienste → Gartenarbeit Manager → Konfigurieren ändern.'});
    return this.block({id:'gm-account-settings',title:'Zeitkonto',content:account})+this.block({id:'gm-users-settings',title:'Benutzer & Rechte',content:users})+versionInfo({frontend:GM_VERSION,backend:this._data.version,ui:UI_VERSION});
  }
  render() {
    if(!this.shadowRoot)return;
    const d=this._data;if(d&&!d.parent&&this._tab==='approvals')this._tab='ledger';
    const pending=d?.entries.filter(r=>r.can_approve).length||0,title=this._config?.title||'Gartenarbeit';
    const items=[{id:'ledger',label:'Zeitkonto'},...(d?.parent?[{id:'approvals',label:`Freigaben${pending?` (${pending})`:''}`}]:[])];
    let content=this._error?notice(this._error,{error:true})+gmButton('Erneut laden','retry'):'';
    if(this._notice)content+=notice(this._notice);
    if(!d)content+=`<p class="hint empty">${this._error?'Bitte Benutzerzuordnung und gegebenenfalls Access Control prüfen.':'Gartenzeitkonto wird geladen …'}</p>`;
    else if(this._tab==='settings')content+=this.settings();
    else {
      content+=`<div class="page-actions"><h3>${gmEsc(title)}</h3>${this._tab==='ledger'?programAddButton({label:d.parent?'Buchung':'Gartenarbeit',action:'book',data:{book:d.parent?'assigned':'worked'}}):''}</div>${this.balances()}`;
      const filters=(d.parent?gmSelect({name:'child-filter',label:'Kind',marker:'filter',value:this._filter,options:[{value:'all',label:'Beide Kinder'},...d.balances.map(b=>({value:b.child,label:b.child}))]}):'')+(this._tab==='ledger'?gmSelect({name:'status-filter',label:'Status',marker:'status',value:this._status,options:[['all','Alle Buchungen'],['pending','Wartet auf Freigabe'],['approved','Verrechnet']].map(([value,label])=>({value,label}))}):'');
      if(filters)content+=`<div class="grid">${filters}</div>`;
      content+=this.entries();
    }
    this.shadowRoot.innerHTML=`<style>${UI_CSS}\n${GM_LAYOUT}</style><ha-card>${navigation({label:title,items,active:this._tab,settings:!!d,help:false})}<main>${content}</main></ha-card><div class="dialog-host"></div>`;
    this.shadowRoot.querySelector('[data-filter]')?.addEventListener('change',e=>{this._filter=e.target.value;this._visibleCount=100;this.render();});
    this.shadowRoot.querySelector('[data-status]')?.addEventListener('change',e=>{this._status=e.target.value;this._visibleCount=100;this.render();});
  }
  dialog(title,body,submit='Speichern') {
    const host=this.shadowRoot.querySelector('.dialog-host');
    const save=gmButton(submit,'submit',{}, {variant:'primary',icon:'save'}).replace('type="button"','type="submit" form="gm-booking-form"');
    host.innerHTML=uiDialog({id:'gm-dialog',title,content:`<form id="gm-booking-form" class="gm-form">${body}<div class="error form-error" role="alert"></div></form>`,actions:gmButton('Abbrechen','cancel',{'cancel':'true'})+save});
    const dialog=host.querySelector('dialog');
    dialog.addEventListener('cancel',e=>{if(this._busy)e.preventDefault();});
    dialog.addEventListener('close',()=>host.replaceChildren());
    dialog.showModal();dialog.querySelector('input:not([type="file"]),select,textarea')?.focus();
    return dialog;
  }
  async photo(eid){const result=await this._hass.callWS({type:'gartenarbeit_manager/photo',entry_id:eid});if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(result.photo))throw new Error('Ungültiges Foto.');return result.photo;}
  async showPhoto(eid) {
    if(this._busy)return;const seq=this._seq;
    const dialog=this.dialog('Foto zur Gartenarbeit','<p class="hint photo-loading">Foto wird geladen …</p>');dialog.querySelector('footer').remove();
    try{const photo=await this.photo(eid);if(seq!==this._seq||!dialog.isConnected||!dialog.open)return;dialog.classList.add('gm-photo-view');const img=document.createElement('img');img.src=photo;img.alt='Foto zur Gartenarbeit';dialog.querySelector('form').replaceChildren(img);}
    catch(e){if(seq===this._seq&&dialog.isConnected)dialog.querySelector('.photo-loading').textContent=e.message||'Foto konnte nicht geladen werden.';}
  }
  edit(existing=null,kind=null) {
    const d=this._data;if(!d||existing&&!existing.can_edit)return;
    const revision=d.revision;
    const value=existing||{child:d.parent?'Maximilian':d.person,kind:kind||(d.parent?'assigned':'worked'),minutes:5,date:d.today,reason:''};
    const choices=type=>{
      const label=type==='correction'?'+ zuweisen / − gutschreiben':'Minuten';
      if(type==='assigned')return gmSelect({name:'minutes',label,value:existing?value.minutes:5,options:[5,10,15].map(n=>({value:n,label:`${n} Minuten`}))});
      return gmField({name:'minutes',label,type:'number',required:true,min:type==='correction'?-1440:1,max:1440,step:1,value:existing?(type==='worked'?-value.minutes:value.minutes):5})+(type==='correction'?`<div class="toolbar gm-presets" role="group" aria-label="Korrektur-Schnellwerte">${[-15,-10,-5,5,10,15].map(n=>gmButton(`${n>0?'+':''}${n}`,'preset',{'correction-minutes':n})).join('')}</div>`:'');
    };
    const identity=existing?`<p class="hint">${gmEsc(value.child)} · ${value.kind==='worked'?'Gartenarbeit':value.kind==='correction'?'Korrektur':'Zuweisung'}<br>Kind und Buchungsart bleiben erhalten.</p>`:d.parent?`<div class="grid">${gmSelect({name:'child',label:'Kind',value:value.child,options:d.balances.map(b=>({value:b.child,label:b.child}))})}${gmSelect({name:'kind',label:'Buchungsart',value:value.kind,options:[{value:'assigned',label:'Zuweisung'},{value:'correction',label:'Korrektur'}]})}</div>`:`<p class="hint">Gartenarbeit für ${gmEsc(d.person)} melden.</p>`;
    const reasonLabel=value.kind==='worked'?'Was hast du gemacht?':value.kind==='correction'?'Grund der Korrektur':'Warum gibt es Gartenarbeit?';
    const body=identity+`<div class="grid"><div data-minute-input>${choices(value.kind)}</div>${gmField({name:'date',label:'Datum',type:'date',required:true,min:'2020-01-01',max:d.today,value:value.date})}</div><label class="field" for="gm-reason"><span data-reason-label>${reasonLabel}</span><textarea id="gm-reason" name="reason" required maxlength="500" rows="3">${gmEsc(value.reason)}</textarea></label><div class="gm-photo-box"><p class="hint" data-photo-status>${existing?.photo?'Vorhandenes Foto bleibt erhalten.':'Foto (optional, JPG / PNG / WebP). Wird automatisch verkleinert.'}</p><div class="toolbar">${existing?.photo?gmButton('Foto ansehen','view-old',{'view-old':'true'}):''}${gmButton('Foto wählen','choose',{'choose':'true'})}${gmButton('Foto entfernen','remove-photo',{'remove-photo':'true'}).replace('<button ',`<button ${existing?.photo?'':'hidden '}`)}</div><input type="file" accept="image/jpeg,image/png,image/webp" data-file hidden><div data-preview></div></div>${value.kind==='worked'?'<p class="hint">Die Minuten zählen erst nach Freigabe durch Vera oder Manuel.</p>':''}`;
    const dialog=this.dialog(existing?'Eintrag bearbeiten':value.kind==='worked'?'Gartenarbeit melden':'Gartenzeit buchen',body,existing?'Änderungen speichern':value.kind==='worked'?'Zur Freigabe melden':'Buchung speichern');
    const form=dialog.querySelector('form'),input=name=>form.querySelector(`[name="${name}"]`),requestId=existing?null:gmRequestId();
    let photoChanged=false,photoValue=null,processing=false;
    input('kind')?.addEventListener('change',e=>{value.kind=e.target.value;form.querySelector('[data-minute-input]').innerHTML=choices(value.kind);form.querySelector('[data-reason-label]').textContent=value.kind==='correction'?'Grund der Korrektur':'Warum gibt es Gartenarbeit?';});
    form.querySelector('[data-minute-input]').addEventListener('click',e=>{const control=e.target.closest('[data-correction-minutes]');if(control&&!control.disabled){input('minutes').value=control.dataset.correctionMinutes;input('minutes').focus();form.querySelector('.form-error').textContent='';}});
    const status=form.querySelector('[data-photo-status]'),preview=form.querySelector('[data-preview]'),file=form.querySelector('[data-file]'),choose=form.querySelector('[data-choose]'),remove=form.querySelector('[data-remove-photo]');
    choose.onclick=()=>file.click();
    remove.onclick=()=>{photoChanged=true;photoValue=null;preview.replaceChildren();status.textContent='Foto wird entfernt.';remove.hidden=true;form.querySelector('[data-view-old]')?.remove();file.value='';};
    form.querySelector('[data-view-old]')?.addEventListener('click',async e=>{const control=e.currentTarget;control.disabled=true;try{const data=await this.photo(existing.id);if(!dialog.isConnected)return;const img=document.createElement('img');img.src=data;img.alt='Vorhandenes Gartenfoto';img.className='photo-preview';preview.replaceChildren(img);}catch(err){form.querySelector('.form-error').textContent=err.message;}finally{control.disabled=false;}});
    file.onchange=async()=>{if(!file.files?.[0])return;processing=true;choose.disabled=true;dialog.querySelector('[type="submit"]').disabled=true;status.textContent='Foto wird aufbereitet …';form.querySelector('.form-error').textContent='';try{const data=await this.compressPhoto(file.files[0]);if(!dialog.isConnected)return;photoValue=data;photoChanged=true;const img=document.createElement('img');img.src=data;img.alt='Ausgewähltes Gartenfoto';img.className='photo-preview';preview.replaceChildren(img);status.textContent='Foto bereit.';remove.hidden=false;form.querySelector('[data-view-old]')?.remove();}catch(err){form.querySelector('.form-error').textContent=err.message;status.textContent=existing?.photo&&!photoChanged?'Vorhandenes Foto bleibt erhalten.':'Bitte ein anderes Foto wählen.';}finally{processing=false;choose.disabled=false;dialog.querySelector('[type="submit"]').disabled=false;file.value='';}};
    form.onsubmit=e=>{e.preventDefault();if(processing)return;const minutes=Number(input('minutes').value);if(value.kind==='correction'&&(!Number.isInteger(minutes)||minutes===0||Math.abs(minutes)>1440)){form.querySelector('.form-error').textContent='Bitte ganze Minuten von −1440 bis +1440 außer 0 eingeben.';input('minutes').focus();return;}const entry={child:value.child,kind:value.kind,minutes,date:input('date').value,reason:input('reason').value};if(existing)entry.id=existing.id;else{entry.request_id=requestId;entry.child=d.parent?input('child').value:d.person;}if(photoChanged||!existing)entry.photo=photoValue;return this.mutate(existing?'update':'add',entry,revision);};
  }
  review(existing) {
    if(!existing?.can_approve)return;const revision=this._data.revision;
    const body=row({title:`${existing.child} · ${existing.reason}`,description:`${gmDate(existing.date)} · Gemeldet: ${existing.reported_minutes??-existing.minutes} Minuten`})+gmField({name:'minutes',label:'Anrechenbare Minuten',type:'number',min:1,max:1440,step:1,required:true,value:-existing.minutes})+'<p class="hint">Erst mit dieser Freigabe werden die Minuten vom offenen Zeitkonto abgezogen. Übererfüllung bleibt als Guthaben erhalten.</p>'+(existing.photo?gmButton('Foto ansehen','review-photo',{'review-photo':'true'})+'<div data-review-preview></div>':'');
    const dialog=this.dialog('Gartenarbeit freigeben',body,'Minuten freigeben'),form=dialog.querySelector('form');
    form.querySelector('[data-review-photo]')?.addEventListener('click',async e=>{const control=e.currentTarget;control.disabled=true;try{const photo=await this.photo(existing.id);if(!dialog.isConnected)return;const img=document.createElement('img');img.src=photo;img.alt='Gemeldete Gartenarbeit';img.className='photo-preview';form.querySelector('[data-review-preview]').replaceChildren(img);}catch(err){form.querySelector('.form-error').textContent=err.message;}finally{control.disabled=false;}});
    form.onsubmit=e=>{e.preventDefault();return this.mutate('approve',{id:existing.id,minutes:Number(form.querySelector('[name="minutes"]').value)},revision);};
  }
 async load(){if(!this._hass||this._busy||this._loading||this.shadowRoot.querySelector('dialog[open]'))return;this._loading=true;const seq=this._seq;try{const data=await this._hass.callWS({type:'gartenarbeit_manager/get'});if(seq!==this._seq||this.shadowRoot.querySelector('dialog[open]'))return;const changed=JSON.stringify(data)!==JSON.stringify(this._data)||!!this._error;this._data=data;this._error='';if(changed)this.render();}catch(e){if(seq===this._seq){this._error=e.message||'Verbindung fehlgeschlagen.';this.render();}}finally{if(seq===this._seq)this._loading=false;}}
 async mutate(operation,entry,revision){if(this._busy)return false;this._busy=true;const seq=this._seq;const controls=[...this.shadowRoot.querySelectorAll('button,input,select,textarea')].filter(el=>!el.disabled);controls.forEach(el=>el.disabled=true);try{const child=entry.child||this._data.entries.find(r=>r.id===entry.id)?.child;const entity_id=this._data.balances.find(b=>b.child===child)?.entity_id;if(!entity_id)throw new Error('Kontoentität nicht verfügbar. Bitte das Gartenzeitkonto unter Access Control zum Lesen und Bedienen freigeben und die Ansicht neu laden.');const data=await this._hass.callWS({type:'gartenarbeit_manager/'+operation,entity_id,revision,entry});if(seq!==this._seq)return false;this._data=data;this._error='';this._notice=operation==='approve'?'Gartenarbeit freigegeben und dem Zeitkonto gutgeschrieben.':operation==='add'&&entry.kind==='worked'?'Gartenarbeit gemeldet. Wartet auf Freigabe.':'Buchung gespeichert.';this.render();return true;}catch(e){if(seq!==this._seq)return false;const error=this.shadowRoot.querySelector('.form-error');if(error)error.textContent=e.message||'Speichern fehlgeschlagen.';else{this._error=e.message||'Speichern fehlgeschlagen.';this.render();}return false;}finally{this._busy=false;controls.forEach(el=>{if(el.isConnected)el.disabled=false;});}}
 async compressPhoto(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Bitte ein JPG-, PNG- oder WebP-Foto wählen.');if(file.size>20*1024*1024)throw new Error('Bitte ein Foto bis 20 MB wählen.');const url=URL.createObjectURL(file);try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Das Foto konnte nicht gelesen werden.'));img.src=url;});if(!img.naturalWidth||!img.naturalHeight)throw new Error('Das Foto hat keine gültige Größe.');const factor=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);for(const quality of [.85,.7,.55,.4]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<950000)return data;}throw new Error('Das Foto ist zu groß. Bitte ein kleineres Bild wählen.');}finally{URL.revokeObjectURL(url);}}
}
if(!customElements.get('gartenarbeit-manager-card'))customElements.define('gartenarbeit-manager-card',GartenarbeitManagerCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='gartenarbeit-manager-card'))window.customCards.push({type:'gartenarbeit-manager-card',name:'Gartenarbeit Manager',description:'Gartenzeitkonto mit Arbeitsmeldungen, Fotos und Freigaben'});
