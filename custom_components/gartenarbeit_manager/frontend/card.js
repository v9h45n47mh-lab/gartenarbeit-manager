/* Gartenarbeit Manager 1.3.1 — pinned, locally bundled HA UI Kit. */
import {
  UI_CSS, UI_VERSION, escapeHtml as gmEsc, button, iconButton, navigation, programAddButton,
  section, row, field, selectField, dialog as uiDialog, notice, versionInfo, bindUI,
  textareaField, numberControl, photoPicker, photoPreview, photoDialog, compressPhoto,
  emptyState, loadingState, feedback, formError, bindGestures,
  historyList, counter, accountTile, accountTiles,
} from './family-ui/1.3.1/family-ui.js';

const GM_VERSION='1.3.1';
// getRandomValues also works on local HTTP origins, where randomUUID is unavailable.
const gmRequestId=()=>{const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;};
const gmDate=day=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(day+'T12:00:00'));
const gmTime=value=>new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
const gmClock=value=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const gmFull=content=>`<div class="full">${content}</div>`;
function gmField({name,...options}) {
  return field({id:`gm-${name}`,name,...options});
}
function gmSelect({name,label,value,options,marker=''}) {
  const control=selectField({id:`gm-${name}`,name,label,value,options});
  return marker?control.replace('<select ',`<select data-${marker} `):control;
}
const gmButton=(label,action,data={},options={})=>button({label,action,data,...options});

class GartenarbeitManagerCard extends HTMLElement {
  constructor() {
    super();this.attachShadow({mode:'open'});
    this._tab='ledger';this._filter='all';this._status='all';this._busy=false;this._loading=false;
    this._seq=0;this._error='';this._notice='';this._expanded=new Set();this._folds=new Map();
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
    this._unbindGestures ||= bindGestures(this,{onPullDown:()=>this.load(),canPull:()=>window.scrollY<=0&&!this.shadowRoot.querySelector('dialog[open]')});
  }
  disconnectedCallback(){clearInterval(this._timer);this._timer=null;this._seq++;this._loading=false;this._unbindUI?.();this._unbindUI=null;this._unbindGestures?.();this._unbindGestures=null;if(this._foldListener)this.shadowRoot.removeEventListener('click',this._foldListener);this._foldListener=null;}
  onAction({action,data}) {
    if(this._busy)return;
    if(action==='navigate'){this._tab=data.page;this._notice='';this.render();}
    else if(action==='book')this.edit(null,data.book);
    else if(action==='edit')this.edit(this._data.entries.find(r=>r.id===data.edit));
    else if(action==='review')this.review(this._data.entries.find(r=>r.id===data.review));
    else if(action==='photo')this.showPhoto(data.photo);
    else if(action==='retry')this.load();
    else if(action==='cancel')this.shadowRoot.querySelector('dialog[open]')?.close();
    else if(action==='minutes-change')this.setFormError('');
  }
  block(props){return section({...props,expanded:this._folds.get(props.id)??props.expanded??true});}
  balances() {
    const tiles=this._data.balances.map(b=>accountTile({id:`gm-account-${b.child.toLowerCase()}`,label:b.child,value:Math.abs(b.remaining),unit:'min',status:b.remaining<0?'Guthaben':b.remaining>0?'offen':'ausgeglichen',state:b.remaining<0?'success':'neutral',description:b.pending?`${b.pending} min warten auf Freigabe`:'',details:`Zugewiesen ${b.assigned} · Erledigt ${b.worked}${b.corrections?` · Korrektur ${b.corrections>0?'+':''}${b.corrections} min`:''}`})).join('');
    const content=accountTiles({content:tiles,label:this._data.balances.length===1?'Dein Zeitkonto':'Zeitkonten'});
    return this.block({id:'gm-balances',title:this._data.balances.length===1?'Dein Zeitkonto':'Zeitkonten',content}).replace('class="settings-group"','class="settings-group balances"');
  }
  visibleEntries() {
    const d=this._data;
    const entries=d.entries.filter(r=>(this._filter==='all'||r.child===this._filter)&&(this._tab==='approvals'?r.can_approve:this._status==='all'||r.review_status===this._status));
    if(this._tab==='approvals')return entries;
    return [...entries].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10);
  }
  entries() {
    const d=this._data;
    const entries=this.visibleEntries();
    if(!entries.length)return emptyState(this._tab==='approvals'?'Keine Gartenarbeit wartet auf Freigabe.':'Keine Buchungen in dieser Ansicht.');
    return entries.map(r=>{
      const pending=r.review_status==='pending',label=r.kind==='worked'?(pending?'Gemeldet':'Freigegeben'):r.kind==='correction'?'Korrektur':'Zugewiesen';
      const actions=(r.can_approve?iconButton({icon:'success',label:'Prüfen & freigeben',action:'review',data:{review:r.id}}):'')+(r.photo?gmButton('Foto','photo',{photo:r.id}):'')+(r.can_edit?iconButton({icon:'edit',label:'Bearbeiten',action:'edit',data:{edit:r.id}}):'');
      let content=row({title:label,description:`${d.parent?r.child+' · ':''}${gmDate(r.date)}`,trailing:actions});
      const events=[{time:gmClock(r.created_at),datetime:r.created_at,title:`Erfasst von ${r.actor_name}`,description:gmTime(r.created_at),status:pending?'pending':'success',result:label}];
      if(r.reviewed_by)events.push({time:gmClock(r.reviewed_at),datetime:r.reviewed_at,title:`Freigegeben von ${r.reviewed_by}`,description:gmTime(r.reviewed_at),status:'success',result:'Verrechnet'});
      content+=historyList({entries:events});
      if(pending)content+=notice('Wartet auf Freigabe; noch nicht im Zeitkonto verrechnet.');
      if(r.reported_minutes!=null)content+=row({title:`Gemeldet: ${r.reported_minutes} Minuten`,description:pending?'Wartet auf Prüfung':`Angerechnet: ${-r.minutes} Minuten`});
      if(r.history?.length)content+=this.block({id:`gm-history-${r.id}`,title:'Änderungsverlauf',trailing:counter(r.history.length,'Änderungen'),expanded:false,content:historyList({entries:r.history.map(h=>({time:gmClock(h.at),datetime:h.at,title:`${h.action==='approved'?'Freigegeben':'Bearbeitet'} von ${h.by}`,description:`${gmTime(h.at)} · Vorher: ${h.before.minutes} min · ${gmDate(h.before.date)} · ${h.before.reason}`,status:'success',result:h.action==='approved'?'Freigegeben':'Bearbeitet'}))})});
      return this.block({id:`gm-entry-${r.id}`,title:r.reason,expanded:false,trailing:counter(`${pending?Math.abs(r.minutes):(r.minutes>0?'+':'')+r.minutes} min`),content}).replace('class="settings-group"',`class="settings-group entry" data-row="${gmEsc(r.id)}"`);
    }).join('');
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
    let content=this._error?feedback(this._error,{kind:'error'})+gmButton('Erneut laden','retry'):'';
    if(this._notice)content+=feedback(this._notice,{kind:'success'});
    if(!d)content+=this._error?emptyState('Bitte Benutzerzuordnung und gegebenenfalls Access Control prüfen.'):loadingState('Gartenzeitkonto wird geladen …');
    else if(this._tab==='settings')content+=this.settings();
    else {
      content+=`<div class="page-actions"><h3>${gmEsc(title)}</h3>${this._tab==='ledger'?programAddButton({label:d.parent?'Buchung':'Gartenarbeit',action:'book',data:{book:d.parent?'assigned':'worked'}}):''}</div>${this.balances()}`;
      const filters=(d.parent?gmSelect({name:'child-filter',label:'Kind',marker:'filter',value:this._filter,options:[{value:'all',label:'Beide Kinder'},...d.balances.map(b=>({value:b.child,label:b.child}))]}):'')+(this._tab==='ledger'?gmSelect({name:'status-filter',label:'Status',marker:'status',value:this._status,options:[['all','Alle Buchungen'],['pending','Wartet auf Freigabe'],['approved','Verrechnet']].map(([value,label])=>({value,label}))}):'');
      content+=this.block({id:this._tab==='ledger'?'gm-bookings':'gm-approvals',title:this._tab==='ledger'?'Buchungen':'Freigaben',trailing:counter(this.visibleEntries().length,this._tab==='ledger'?'Letzte Buchungen, höchstens zehn':'Offene Freigaben'),expanded:this._tab==='approvals',content:(filters?`<div class="grid">${filters}</div>`:'')+this.entries()});
    }
    this.shadowRoot.innerHTML=`<style>${UI_CSS}</style><ha-card>${navigation({label:title,items,active:this._tab,settings:!!d,help:false})}<main>${content}</main></ha-card><div class="dialog-host"></div>`;
    this.shadowRoot.querySelector('[data-filter]')?.addEventListener('change',e=>{this._filter=e.target.value;this.render();});
    this.shadowRoot.querySelector('[data-status]')?.addEventListener('change',e=>{this._status=e.target.value;this.render();});
  }
  dialog(title,body,submit='Speichern') {
    const save=gmButton(submit,'submit',{}, {variant:'primary',icon:'save'}).replace('type="button"','type="submit" form="gm-booking-form"');
    return this.mountDialog(uiDialog({id:'gm-dialog',title,content:`<form id="gm-booking-form" class="grid">${body}${formError('').replace('class="modal-save-error"','class="modal-save-error form-error full"')}</form>`,actions:gmButton('Abbrechen','cancel',{'cancel':'true'})+save}));
  }
  mountDialog(markup) {
    const host=this.shadowRoot.querySelector('.dialog-host');host.innerHTML=markup;
    const dialog=host.querySelector('dialog');
    dialog.addEventListener('cancel',e=>{if(this._busy)e.preventDefault();});
    dialog.addEventListener('close',()=>host.replaceChildren());
    dialog.showModal();dialog.querySelector('input:not([type="file"]),select,textarea')?.focus();
    return dialog;
  }
  setFormError(message,root=this.shadowRoot){const error=root.querySelector('.form-error');if(error){error.textContent=message;error.hidden=!message;}}
  async photo(eid){const result=await this._hass.callWS({type:'gartenarbeit_manager/photo',entry_id:eid});if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(result.photo))throw new Error('Ungültiges Foto.');return result.photo;}
  async showPhoto(eid) {
    if(this._busy)return;const seq=this._seq;
    const dialog=this.mountDialog(uiDialog({id:'gm-dialog',title:'Foto zur Gartenarbeit',content:loadingState('Foto wird geladen …')}));
    try{
      const photo=await this.photo(eid);if(seq!==this._seq||!dialog.isConnected||!dialog.open)return;
      const template=document.createElement('template');template.innerHTML=photoDialog({id:dialog.id,title:'Foto zur Gartenarbeit',src:photo,alt:'Foto zur Gartenarbeit'});
      // Retain the open native dialog and its opener while taking all contents from photoDialog.
      dialog.replaceChildren(...template.content.firstElementChild.childNodes);dialog.querySelector('[data-ui="close-dialog"]').focus();
    }
    catch(e){if(seq===this._seq&&dialog.isConnected)dialog.querySelector('.modal-body').innerHTML=feedback(e.message||'Foto konnte nicht geladen werden.',{kind:'error'});}
  }
  edit(existing=null,kind=null) {
    const d=this._data;if(!d||existing&&!existing.can_edit)return;
    const revision=d.revision;
    const value=existing||{child:d.parent?'Maximilian':d.person,kind:kind||(d.parent?'assigned':'worked'),minutes:5,date:d.today,reason:''};
    const choices=type=>{
      const label=type==='correction'?'+ zuweisen / − gutschreiben':'Minuten';
      if(type==='assigned')return gmSelect({name:'minutes',label,value:existing?value.minutes:5,options:[5,10,15].map(n=>({value:n,label:`${n} Minuten`}))});
      return numberControl({id:'gm-minutes',name:'minutes',label,required:true,min:type==='correction'?-1440:1,max:1440,step:1,value:existing?(type==='worked'?-value.minutes:value.minutes):5,action:'minutes-change',presets:type==='correction'?[-15,-10,-5,5,10,15].map(n=>({value:n,label:`${n>0?'+':''}${n}`})):[]});
    };
    const identity=existing?`<p class="hint">${gmEsc(value.child)} · ${value.kind==='worked'?'Gartenarbeit':value.kind==='correction'?'Korrektur':'Zuweisung'}<br>Kind und Buchungsart bleiben erhalten.</p>`:d.parent?`<div class="grid">${gmSelect({name:'child',label:'Kind',value:value.child,options:d.balances.map(b=>({value:b.child,label:b.child}))})}${gmSelect({name:'kind',label:'Buchungsart',value:value.kind,options:[{value:'assigned',label:'Zuweisung'},{value:'correction',label:'Korrektur'}]})}</div>`:`<p class="hint">Gartenarbeit für ${gmEsc(d.person)} melden.</p>`;
    const reasonLabel=value.kind==='worked'?'Was hast du gemacht?':value.kind==='correction'?'Grund der Korrektur':'Warum gibt es Gartenarbeit?';
    const body=gmFull(identity)+gmFull(`<div class="grid"><div data-minute-input>${choices(value.kind)}</div>${gmField({name:'date',label:'Datum',type:'date',required:true,min:'2020-01-01',max:d.today,value:value.date})}</div>`)+gmFull(textareaField({id:'gm-reason',name:'reason',label:reasonLabel,value:value.reason,required:true,maxLength:500,rows:3}))+gmFull(photoPicker({id:'gm-photo'}))+(value.kind==='worked'?'<p class="hint full">Die Minuten zählen erst nach Freigabe durch Vera oder Manuel.</p>':'');
    const dialog=this.dialog(existing?'Eintrag bearbeiten':value.kind==='worked'?'Gartenarbeit melden':'Gartenzeit buchen',body,existing?'Änderungen speichern':value.kind==='worked'?'Zur Freigabe melden':'Buchung speichern');
    const form=dialog.querySelector('form'),input=name=>form.querySelector(`[name="${name}"]`),requestId=existing?null:gmRequestId();
    let photoChanged=false,photoValue=null,processing=false;
    input('kind')?.addEventListener('change',e=>{value.kind=e.target.value;form.querySelector('[data-minute-input]').innerHTML=choices(value.kind);form.querySelector('label[for="gm-reason"] > span').textContent=value.kind==='correction'?'Grund der Korrektur':'Warum gibt es Gartenarbeit?';this.setFormError('',form);});
    const picker=form.querySelector('[data-ui-photo]'),status=picker.querySelector('[data-photo-status]'),preview=picker.querySelector('[data-photo-preview]'),file=picker.querySelector('input[type=file]'),choose=picker.querySelector('[data-ui-photo-choose]'),remove=picker.querySelector('[data-ui-photo-remove]');
    if(existing?.photo){status.textContent='Vorhandenes Foto bleibt erhalten.';remove.hidden=false;picker.querySelector('.toolbar').insertAdjacentHTML('afterbegin',gmButton('Foto ansehen','view-old',{'view-old':'true'}));}
    // Keep save/replace/remove atomic with the booking. Markup and compression come from the kit;
    // local handlers stop delegation so its standalone picker does not process the same file twice.
    choose.onclick=e=>{e.stopPropagation();file.click();};
    remove.onclick=e=>{e.stopPropagation();photoChanged=true;photoValue=null;preview.replaceChildren();status.textContent='Foto wird entfernt.';remove.hidden=true;form.querySelector('[data-view-old]')?.remove();file.value='';};
    form.querySelector('[data-view-old]')?.addEventListener('click',async e=>{const control=e.currentTarget;control.disabled=true;try{const data=await this.photo(existing.id);if(!dialog.isConnected)return;preview.innerHTML=photoPreview({src:data,alt:'Vorhandenes Gartenfoto'});}catch(err){this.setFormError(err.message,form);}finally{control.disabled=false;}});
    file.onchange=async e=>{
      e.stopPropagation();if(!file.files?.[0])return;processing=true;
      const controls=[...picker.querySelectorAll('button,input'),dialog.querySelector('[type="submit"]')].filter(el=>!el.disabled);controls.forEach(el=>el.disabled=true);
      status.textContent='Foto wird aufbereitet …';this.setFormError('',form);
      try{const data=await compressPhoto(file.files[0]);if(!dialog.isConnected)return;photoValue=data;photoChanged=true;preview.innerHTML=photoPreview({src:data,alt:'Ausgewähltes Gartenfoto'});status.textContent='Foto bereit.';remove.hidden=false;form.querySelector('[data-view-old]')?.remove();}
      catch(err){this.setFormError(err.message,form);status.textContent=existing?.photo&&!photoChanged?'Vorhandenes Foto bleibt erhalten.':'Bitte ein anderes Foto wählen.';}
      finally{processing=false;controls.forEach(el=>el.disabled=false);file.value='';}
    };
    form.onsubmit=e=>{e.preventDefault();if(processing)return;const minutes=Number(input('minutes').value);if(value.kind==='correction'&&(!Number.isInteger(minutes)||minutes===0||Math.abs(minutes)>1440)){this.setFormError('Bitte ganze Minuten von −1440 bis +1440 außer 0 eingeben.',form);input('minutes').focus();return;}const entry={child:value.child,kind:value.kind,minutes,date:input('date').value,reason:input('reason').value};if(existing)entry.id=existing.id;else{entry.request_id=requestId;entry.child=d.parent?input('child').value:d.person;}if(photoChanged||!existing)entry.photo=photoValue;return this.mutate(existing?'update':'add',entry,revision);};
  }
  review(existing) {
    if(!existing?.can_approve)return;const revision=this._data.revision;
    const body=gmFull(row({title:`${existing.child} · ${existing.reason}`,description:`${gmDate(existing.date)} · Gemeldet: ${existing.reported_minutes??-existing.minutes} Minuten`}))+gmFull(gmField({name:'minutes',label:'Anrechenbare Minuten',type:'number',min:1,max:1440,step:1,required:true,value:-existing.minutes}))+'<p class="hint full">Erst mit dieser Freigabe werden die Minuten vom offenen Zeitkonto abgezogen. Übererfüllung bleibt als Guthaben erhalten.</p>'+(existing.photo?gmFull(gmButton('Foto ansehen','review-photo',{'review-photo':'true'})+'<div data-review-preview></div>'):'');
    const dialog=this.dialog('Gartenarbeit freigeben',body,'Minuten freigeben'),form=dialog.querySelector('form');
    form.querySelector('[data-review-photo]')?.addEventListener('click',async e=>{const control=e.currentTarget;control.disabled=true;try{const photo=await this.photo(existing.id);if(!dialog.isConnected)return;form.querySelector('[data-review-preview]').innerHTML=photoPreview({src:photo,alt:'Gemeldete Gartenarbeit'});}catch(err){this.setFormError(err.message,form);}finally{control.disabled=false;}});
    form.onsubmit=e=>{e.preventDefault();return this.mutate('approve',{id:existing.id,minutes:Number(form.querySelector('[name="minutes"]').value)},revision);};
  }
 async load(){if(!this._hass||this._busy||this._loading||this.shadowRoot.querySelector('dialog[open]'))return;this._loading=true;const seq=this._seq;try{const data=await this._hass.callWS({type:'gartenarbeit_manager/get'});if(seq!==this._seq||this.shadowRoot.querySelector('dialog[open]'))return;const changed=JSON.stringify(data)!==JSON.stringify(this._data)||!!this._error;this._data=data;this._error='';if(changed)this.render();}catch(e){if(seq===this._seq){this._error=e.message||'Verbindung fehlgeschlagen.';this.render();}}finally{if(seq===this._seq)this._loading=false;}}
 async mutate(operation,entry,revision){if(this._busy)return false;this._busy=true;const seq=this._seq;const controls=[...this.shadowRoot.querySelectorAll('button,input,select,textarea')].filter(el=>!el.disabled);controls.forEach(el=>el.disabled=true);try{const child=entry.child||this._data.entries.find(r=>r.id===entry.id)?.child;const entity_id=this._data.balances.find(b=>b.child===child)?.entity_id;if(!entity_id)throw new Error('Kontoentität nicht verfügbar. Bitte das Gartenzeitkonto unter Access Control zum Lesen und Bedienen freigeben und die Ansicht neu laden.');const data=await this._hass.callWS({type:'gartenarbeit_manager/'+operation,entity_id,revision,entry});if(seq!==this._seq)return false;this._data=data;this._error='';this._notice=operation==='approve'?'Gartenarbeit freigegeben und dem Zeitkonto gutgeschrieben.':operation==='add'&&entry.kind==='worked'?'Gartenarbeit gemeldet. Wartet auf Freigabe.':'Buchung gespeichert.';this.render();return true;}catch(e){if(seq!==this._seq)return false;const error=this.shadowRoot.querySelector('.form-error');if(error)this.setFormError(e.message||'Speichern fehlgeschlagen.');else{this._error=e.message||'Speichern fehlgeschlagen.';this.render();}return false;}finally{this._busy=false;controls.forEach(el=>{if(el.isConnected)el.disabled=false;});}}
}
if(!customElements.get('gartenarbeit-manager-card'))customElements.define('gartenarbeit-manager-card',GartenarbeitManagerCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='gartenarbeit-manager-card'))window.customCards.push({type:'gartenarbeit-manager-card',name:'Gartenarbeit Manager',description:'Gartenzeitkonto mit Arbeitsmeldungen, Fotos und Freigaben'});
