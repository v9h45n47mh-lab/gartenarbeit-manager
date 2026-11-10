const assert=require('node:assert/strict');

// Compare application controls to untouched renderers in an independent ShadowRoot.
// Both inherit the same HA theme and viewport; the reference never appears in screenshots.
async function prepareKitReference(page,photo){
  await page.evaluate(async photo=>{
    const kit=await import('/gartenarbeit-manager/family-ui/1.3.0/family-ui.js');
    const host=document.createElement('div');Object.assign(host.style,{position:'fixed',left:'-10000px',top:'0',visibility:'hidden',pointerEvents:'none'});host.attachShadow({mode:'open'});document.body.append(host);
    window.kitReference={kit,host,photo};
  },photo);
}

async function assertKitParity(page,pairs,context){
  await page.mouse.move(0,0);
  const differences=await page.evaluate(async pairs=>{
    const actual=document.querySelector('gartenarbeit-manager-card').shadowRoot;
    const focused=actual.activeElement;
    const {kit:k,host,photo}=window.kitReference,reference=host.shadowRoot;
    host.style.width=innerWidth+'px';
    const fields=k.numberControl({id:'reference-minutes',name:'minutes',label:'Minuten',value:5,presets:[-15,-10,-5,5,10,15]})+
      k.field({id:'reference-date',label:'Datum',type:'date',value:'2026-11-10'})+
      k.selectField({id:'reference-child',label:'Kind',options:[{value:'Paul',label:'Paul'}]})+
      k.textareaField({id:'reference-reason',label:'Beschreibung',name:'reason',value:'Gartenarbeit'})+
      `<div class="full">${k.photoPicker({id:'reference-photo',src:photo})}</div>`+k.formError('Testfehler');
    reference.innerHTML=`<style>${k.UI_CSS}</style><ha-card>${k.navigation({label:'Gartenarbeit',items:[{id:'ledger',label:'Zeitkonto'}],active:actual.querySelector('.settings-button').classList.contains('selected')?'settings':'ledger',help:false})}<main>${k.accountTiles({content:k.accountTile({id:'reference-account',label:'Maximilian',value:25,unit:'min',status:'Guthaben',state:actual.querySelector('.fui-account-tile')?.classList.contains('success')?'success':'neutral',description:'30 min warten auf Freigabe'})+k.accountTile({id:'reference-account-paul',label:'Paul',value:0,unit:'min',status:'offen'})})}<div class="page-actions"><h3>Gartenarbeit</h3>${k.programAddButton({label:'Buchung'})}</div>${k.section({id:'reference-section',title:'Buchung',trailing:k.counter('15 min'),content:k.row({title:'Paul',description:'Beschreibung',trailing:k.statusBadge({label:'15 min offen'})+k.statusBadge({label:'15 min Guthaben',state:'success'})})+k.historyList({entries:[{time:'09:00',title:'Erfasst von Paul',description:'10.11.26, 09:00',status:'success'},{time:'09:05',title:'Erfasst von Maximilian',description:'10.11.26, 09:05',status:'pending'}]})})}</main></ha-card>`+
      k.dialog({id:'reference-dialog',title:'Gartenzeit buchen',content:`<form class="grid">${fields}</form>`,actions:k.button({label:'Abbrechen',action:'cancel'})+k.button({label:'Speichern',action:'submit',variant:'primary',icon:'save'})})+
      k.photoDialog({id:'reference-large',title:'Foto zur Gartenarbeit',src:photo});
    // Render away from the viewport instead of display:none so auto margins resolve
    // against the same viewport and full-width picker as the native application modal.
    reference.querySelectorAll('dialog').forEach(dialog=>dialog.setAttribute('open',''));
    await Promise.all([...reference.querySelectorAll('img')].map(img=>img.decode()));
    const properties=['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','color','backgroundColor',
      'paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft',
      'rowGap','columnGap','textIndent','fill','stroke','strokeWidth'];
    const differences=[];
    for(const [selector,referenceSelector=selector] of pairs){
      const a=actual.querySelector(selector),r=reference.querySelector(referenceSelector);
      if(!a||!r){differences.push({selector,referenceSelector,missing:!a?'application':'reference'});continue;}
      const left=getComputedStyle(a),right=getComputedStyle(r);
      for(const property of properties)if(left[property]!==right[property])differences.push({selector,property,actual:left[property],reference:right[property]});
    }
    // Reference dialogs must release their native CloseWatchers before keyboard checks.
    reference.querySelectorAll('dialog').forEach(dialog=>dialog.close());reference.replaceChildren();
    if(focused?.isConnected)focused.focus();
    return differences;
  },pairs);
  assert.deepEqual(differences,[],`Unmodified HA UI Kit styles: ${context}`);
}

const listPairs=['.settings-button','.settings-button svg','.settings-fold','.settings-fold span','.setting-row','.row-text strong','.row-text small','.fui-counter','.fui-account-tiles','.fui-account-tile','.fui-account-label','.fui-account-value','.fui-account-unit','.fui-account-description','.page-actions .program-add','.daily-history-row','.daily-command strong','.completed .command-result svg','.pending .command-result svg'].map(s=>[s]);
const formPairs=[['dialog .modal-head'],['dialog .modal-head h3'],['dialog .modal-body'],['dialog footer'],
  ['dialog form.grid'],['dialog .field'],['dialog .field > span'],['dialog input[type=number]'],['dialog select'],['dialog textarea'],
  ['dialog .fui-presets button'],['dialog .gm-photo-box'],['dialog [data-ui-photo-choose]'],['dialog .modal-save-error'],['dialog .primary'],['dialog .primary svg']];

module.exports={prepareKitReference,assertKitParity,listPairs,formPairs};
