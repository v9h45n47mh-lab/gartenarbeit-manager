/* HA UI Kit 1.1.0 | MIT | Shutter Manager 1.4.0 */
export const UI_VERSION = "1.1.0";
export const UI_CSS = ":host{--fui-font-body:14px;--fui-icon:21px;--fui-touch:40px;--fui-section-padding:10px;--fui-row-padding:4px}\n/* Shared ShadowRoot styles. Values follow Shutter Manager 1.4.0. */\n:host{display:block;color:var(--primary-text-color,#212121);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--fui-font-body);line-height:1.4}\n*{box-sizing:border-box}\nha-card,.ui-card{display:block;background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#e0e0e0));border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);overflow:hidden}\nh3,h4,p{margin:0}h3{font-size:16px;font-weight:500}small,.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#727272)}\nbutton,input,select,textarea{font:inherit}\nbutton{color:var(--primary-color,#03a9f4);border:0;background:transparent;border-radius:var(--ha-button-border-radius,20px);padding:9px 14px;cursor:pointer;line-height:1.35;font-weight:500}\nbutton:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}\nbutton:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}\nbutton:disabled{opacity:.45;cursor:default}button:disabled:hover{background:transparent}\nbutton.primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}button.danger{color:var(--error-color,#db4437)}\nbutton>.ui-icon+span{margin-left:6px}\n.ui-icon{width:var(--fui-icon);height:var(--fui-icon);flex-shrink:0;vertical-align:middle;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n.ui-icon.filled{fill:currentColor;stroke:none}.chevron{width:20px;height:20px;transform:rotate(-90deg);transition:transform .15s}.chevron.expanded{transform:rotate(0)}\n.card-top{display:flex;align-items:stretch;border-bottom:1px solid var(--divider-color,#e0e0e0);min-height:52px}\nnav{display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;padding:0 8px}nav::-webkit-scrollbar{display:none}\nnav button{flex-shrink:0;border-radius:0;border-bottom:2px solid transparent;color:var(--secondary-text-color,#727272);padding:16px 14px;white-space:nowrap;font-size:14px}\nnav button.selected{border-bottom-color:var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4)}\n.icon-tab{display:grid;place-items:center;width:48px;padding:10px!important}.icon-tab .ui-icon{width:24px;height:24px}\n.settings-button{width:48px;flex-shrink:0;display:grid;place-items:center;padding:12px;border-radius:0;color:var(--secondary-text-color,#727272)}\n.settings-button.selected{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}.settings-button svg{width:24px;height:24px}\nmain{padding:8px 16px 16px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}\n.page-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0}.page-actions button{font-size:13px}\n.program-add{font-size:13px}\n.program-order{display:flex;gap:0}.program-order button{width:30px;height:34px;padding:4px;color:var(--primary-color,#03a9f4);font-size:18px;line-height:1}\n.filter-button{margin-right:auto;border:1px solid var(--divider-color,#e0e0e0);padding:6px 12px;align-self:center}\n.filter-button[aria-pressed=\"true\"]{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);border-color:var(--primary-color,#03a9f4)}\n.edit-button{display:inline-flex;align-items:center;justify-content:center;min-width:var(--fui-touch);min-height:var(--fui-touch);padding:8px}.edit-button .ui-icon{width:20px;height:20px}\n.settings-group{padding:var(--fui-section-padding) 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.settings-group:last-child{border-bottom:0}\n.settings-heading-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.settings-heading-row .settings-fold{flex:1;min-width:0}.settings-heading-row>button{flex-shrink:0;font-size:13px}\n.settings-fold{display:flex;align-items:center;gap:6px;width:100%;padding:0;color:var(--primary-text-color,#212121);text-align:left}.settings-fold span{font-size:14px;font-weight:500;overflow-wrap:anywhere}\n.setting-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:var(--fui-touch);padding:var(--fui-row-padding) 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.setting-row:last-child{border-bottom:0}\n.row-text{flex:1;min-width:0;overflow-wrap:anywhere}.row-text strong{font-size:13px;font-weight:500;line-height:1.35}.row-text small{display:block}.setting-row>.toolbar{gap:0;flex-shrink:0}\n.toggle{display:inline-flex;align-items:center;gap:9px;padding:6px 0;color:var(--primary-text-color,#212121);font-size:12px;font-weight:400;white-space:nowrap;min-height:40px}.toggle:hover{background:transparent}\n.switch-track{display:inline-flex;align-items:center;width:36px;height:20px;border-radius:12px;background:var(--switch-unchecked-track-color,#9e9e9e);padding:2px;flex-shrink:0}.switch-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--switch-unchecked-button-color,#fff);box-shadow:0 1px 3px #0003;transition:transform .15s}\n.toggle.on .switch-track{background:color-mix(in srgb,var(--primary-color,#03a9f4) 50%,transparent)}.toggle.on .switch-thumb{transform:translateX(16px);background:var(--primary-color,#03a9f4)}\n.setting-row .toggle>span:last-child{display:none}\n.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.full{grid-column:1/-1}.field{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:12px}.field>span{color:var(--secondary-text-color,#727272)}\ninput:not([type=checkbox]):not([type=range]),select,textarea{width:100%;min-width:0;border:1px solid var(--divider-color,#bdbdbd);border-radius:4px;padding:11px 10px;color:var(--primary-text-color,#212121);background:var(--input-fill-color,var(--secondary-background-color,#f5f5f5))}\ninput[type=checkbox]{width:18px;height:18px;accent-color:var(--primary-color,#03a9f4)}\n.modal{padding:0;width:800px;max-width:calc(100% - 48px);max-height:90vh;border:0;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-dialog-border-radius,12px);box-shadow:0 8px 32px #0004}\n.modal[open]{display:flex;flex-direction:column}.modal::backdrop{background:#0006}\n.modal-head,footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;flex-shrink:0}.modal-head{border-bottom:1px solid var(--divider-color,#e0e0e0)}.modal-head h3{font-size:20px;font-weight:400;overflow-wrap:anywhere}.modal-head button{color:var(--secondary-text-color,#727272)}.modal-body{padding:20px 24px;overflow-y:auto}footer{border-top:1px solid var(--divider-color,#e0e0e0);justify-content:flex-end;flex-wrap:wrap}\n.notice,.error{padding:12px 16px;font-size:13px}.notice{color:var(--secondary-text-color,#727272)}.error{color:var(--error-color,#db4437);background:color-mix(in srgb,var(--error-color,#db4437) 8%,transparent)}\n.version-info{font-size:12px;color:var(--secondary-text-color,#727272);margin-top:16px;overflow-wrap:anywhere}\n[hidden]{display:none!important}\n@media(max-width:600px){.card-top{min-height:48px}nav{padding:0 4px}nav button{padding:14px 8px;font-size:13px}.settings-button{width:42px;padding:9px}main{padding:4px 12px 12px}.settings-heading-row{gap:8px}.desktop-only{display:none!important}.modal{max-width:calc(100% - 16px);max-height:96vh;max-height:96dvh}.modal-head,footer{padding:12px 16px}.modal-head h3{font-size:18px}.modal-body{padding:16px}.grid{grid-template-columns:minmax(0,1fr)}.full{grid-column:auto}}\n@media(prefers-reduced-motion:reduce){.chevron,.switch-thumb{transition:none}}\n";
// Source paths: Shutter Manager 1.4.0. See docs/PROVENANCE.json.
const ICON_PATHS = Object.freeze({
  "sunrise": "<path d=\"M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 9V2m-3 3 3-3 3 3\"/>",
  "sunset": "<path d=\"M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 2v7m-3-3 3 3 3-3\"/>",
  "lock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4m-4 5v2\"/>",
  "unlock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 7.5-2M12 15v2\"/>",
  "temperature": "<path d=\"M9 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0M12 8v10\"/><circle cx=\"12\" cy=\"18\" r=\"1\"/>",
  "illuminance": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5\"/>",
  "schedule": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 2\"/>",
  "sensors": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M6.3 6.3a8 8 0 0 0 0 11.4m11.4-11.4a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17m17-17a12 12 0 0 1 0 17\"/>",
  "success": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m7 12 3 3 7-7\"/>",
  "failure": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v6m0 4h.01\"/>",
  "trash": "<path d=\"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6\"/>",
  "move": "<path d=\"M14 4H4v16h10M10 12h12m-4-4 4 4-4 4\"/>",
  "copy": "<rect x=\"8\" y=\"8\" width=\"13\" height=\"13\" rx=\"2\"/><path d=\"M16 8V3H3v13h5\"/>",
  "edit": "<path d=\"M4 16l12-12 4 4L8 20H4v-4M14 6l4 4\"/>",
  "unknown": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M10 8a2 2 0 1 1 3 2c-1 .5-1 1-1 2m0 4h.01\"/>",
  "settings": "<path d=\"M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.63l-1.92-3.32a.49.49 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 0 0-.6.22L2.68 8.85a.49.49 0 0 0 .12.63l2.03 1.58a7.3 7.3 0 0 0 0 1.88L2.8 14.52a.49.49 0 0 0-.12.63l1.92 3.32c.12.22.38.31.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.09.48 0 .6-.22l1.92-3.32a.49.49 0 0 0-.12-.63zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z\"/>",
  "help": "<path d=\"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-3h2v-2h-2v2zm1-11a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z\"/>",
  "chevron": "<path d=\"M4 6l4 4 4-4\"/>",
  "add": "<path d=\"M12 5v14M5 12h14\"/>",
  "close": "<path d=\"m6 6 12 12M6 18 18 6\"/>",
  "save": "<path d=\"M5 3h12l4 4v14H3V3h2M7 3v6h10V3M7 21v-8h10v8\"/>",
  "up": "<path d=\"m5 15 7-7 7 7\"/>",
  "down": "<path d=\"m5 9 7 7 7-7\"/>"
});
export const ICON_NAMES = Object.freeze(Object.keys(ICON_PATHS));
export function icon(name, {expanded = false} = {}) {
  if (!Object.hasOwn(ICON_PATHS, name)) throw new TypeError(`Unknown icon: ${name}`);
  const filled = name === 'settings' || name === 'help';
  const chevron = name === 'chevron';
  return `<svg class="ui-icon${filled ? ' filled' : ''}${chevron ? ' chevron' : ''}${chevron && expanded ? ' expanded' : ''}" data-icon="${name}" viewBox="0 0 ${chevron ? '16 16' : '24 24'}" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}


/** Text/attribute escaping; content parameters explicitly accept trusted application markup. */
export function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function dataAttrs(data = {}) {
  return Object.entries(data).map(([key, value]) => {
    if (!/^[a-z][a-z0-9-]*$/.test(key)) throw new TypeError(`Invalid data attribute: ${key}`);
    return ` data-${key}="${escapeHtml(value)}"`;
  }).join('');
}

function actionAttrs(action, data) {
  if (Object.hasOwn(data || {}, 'action')) throw new TypeError('Use the action argument for data-action');
  return ` data-action="${escapeHtml(action)}"${dataAttrs(data)}`;
}

export function button({label, action, icon: name, variant = 'text', disabled = false, data = {}}) {
  if (!['text', 'primary', 'danger'].includes(variant)) throw new TypeError('Unknown button variant');
  return `<button type="button" class="${variant === 'text' ? '' : variant}"${actionAttrs(action, data)}${disabled ? ' disabled' : ''}>${name ? icon(name) : ''}<span>${escapeHtml(label)}</span></button>`;
}

/** Shutter Manager's text plus is intentional: do not substitute the generic add SVG. */
export function programAddButton({label = 'Programm', action = 'new-program', disabled = false, data = {}} = {}) {
  return `<button type="button" class="primary program-add"${actionAttrs(action, data)}${disabled ? ' disabled' : ''}>+ ${escapeHtml(label)}</button>`;
}

/** Controlled ordering: index/count refer to the sortable group, not the whole list. */
export function programOrderButtons({programId, index, count, action = 'move-program', disabled = false, desktopOnly = true, upLabel = 'Nach oben sortieren', downLabel = 'Nach unten sortieren'}) {
  if (typeof programId !== 'string' || !programId) throw new TypeError('Ordering requires a program ID');
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index >= count) throw new RangeError('Ordering requires 0 <= index < count');
  const control = (direction, label, glyph, atBoundary) => `<button type="button"${actionAttrs(action, {program:programId, direction})} title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"${disabled || atBoundary ? ' disabled' : ''}>${glyph}</button>`;
  return `<div class="program-order${desktopOnly ? ' desktop-only' : ''}">${control('up', upLabel, '↑', index === 0)}${control('down', downLabel, '↓', index === count - 1)}</div>`;
}

export function iconButton({icon: name, label, action, disabled = false, danger = false, data = {}, desktopOnly = false}) {
  if (!label) throw new TypeError('Icon buttons require a label');
  return `<button type="button" class="edit-button${danger ? ' danger' : ''}${desktopOnly ? ' desktop-only' : ''}"${actionAttrs(action, data)} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>${icon(name)}</button>`;
}

export function navigation({label, items, active, settings = true, help = true, settingsLabel = 'Einstellungen', helpLabel = 'Anleitung'}) {
  const navButton = (item, cls = '') => `<button type="button" class="${cls}${item.id === active ? ' selected' : ''}"${actionAttrs('navigate', {page:item.id})} aria-current="${item.id === active ? 'page' : 'false'}"${item.icon ? ` aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}"` : ''}>${item.icon ? icon(item.icon) : escapeHtml(item.label)}</button>`;
  return `<div class="card-top"><nav aria-label="${escapeHtml(label)}">${items.map(item => navButton(item, item.icon ? 'icon-tab' : '')).join('')}</nav>${help ? navButton({id:'help', label:helpLabel, icon:'help'}, 'settings-button') : ''}${settings ? navButton({id:'settings', label:settingsLabel, icon:'settings'}, 'settings-button') : ''}</div>`;
}

export function toggle({label, action, checked = false, disabled = false, data = {}}) {
  return `<button type="button" class="toggle${checked ? ' on' : ''}" role="switch" aria-checked="${Boolean(checked)}" aria-label="${escapeHtml(label)}"${actionAttrs(action, data)}${disabled ? ' disabled' : ''}><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span><span>${escapeHtml(label)}</span></button>`;
}

export function filterButton({label, action, selected = false, data = {}}) {
  return `<button type="button" class="filter-button"${actionAttrs(action, data)} aria-pressed="${Boolean(selected)}">${escapeHtml(label)}</button>`;
}

/** id must be unique within the card's ShadowRoot. trailing/content are trusted markup. */
export function section({id, title, content = '', trailing = '', expanded = true}) {
  if (!id || /\s/.test(id)) throw new TypeError('Section requires a nonempty ID without whitespace');
  return `<section class="settings-group" data-settings="${escapeHtml(id)}"><div class="settings-heading-row"><button type="button" class="settings-fold" data-ui="collapse" aria-expanded="${Boolean(expanded)}" aria-controls="${escapeHtml(id)}-content">${icon('chevron', {expanded})}<span>${escapeHtml(title)}</span></button>${trailing}</div><div id="${escapeHtml(id)}-content"${expanded ? '' : ' hidden'}>${content}</div></section>`;
}

export function row({title, description = '', trailing = ''}) {
  return `<div class="setting-row"><div class="row-text"><strong>${escapeHtml(title)}</strong>${description ? `<small>${escapeHtml(description)}</small>` : ''}</div><div class="toolbar">${trailing}</div></div>`;
}

export function field({id, label, value = '', type = 'text', required = false, disabled = false}) {
  if (!['text','number','time','date','email','search'].includes(type)) throw new TypeError('Unsupported field type');
  return `<label class="field" for="${escapeHtml(id)}"><span>${escapeHtml(label)}</span><input id="${escapeHtml(id)}" type="${type}" value="${escapeHtml(value)}"${required ? ' required' : ''}${disabled ? ' disabled' : ''}></label>`;
}

export function selectField({id, label, value = '', options, disabled = false}) {
  return `<label class="field" for="${escapeHtml(id)}"><span>${escapeHtml(label)}</span><select id="${escapeHtml(id)}"${disabled ? ' disabled' : ''}>${options.map(option => `<option value="${escapeHtml(option.value)}"${String(option.value) === String(value) ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></label>`;
}

/** A native modal: call showModal() after inserting it. Escape and focus stay native. */
export function dialog({id, title, content, actions = '', closeLabel = 'Schließen'}) {
  return `<dialog id="${escapeHtml(id)}" class="modal" aria-labelledby="${escapeHtml(id)}-title"><div class="modal-head"><h3 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h3><button type="button" class="edit-button" data-ui="close-dialog" aria-label="${escapeHtml(closeLabel)}" title="${escapeHtml(closeLabel)}">${icon('close')}</button></div><div class="modal-body">${content}</div><footer>${actions}</footer></dialog>`;
}

export function notice(message, {error = false} = {}) {
  return `<div class="${error ? 'error' : 'notice'}" role="${error ? 'alert' : 'status'}">${escapeHtml(message)}</div>`;
}

export function versionInfo({frontend, backend, ui, label = 'Oberfläche', backendLabel = 'Integration'}) {
  return `<p class="version-info">${escapeHtml(label)} ${escapeHtml(frontend)}${backend ? ` · ${escapeHtml(backendLabel)} ${escapeHtml(backend)}` : ''}${ui ? ` · UI ${escapeHtml(ui)}` : ''}</p>`;
}

/** Bind once per ShadowRoot; the returned function removes the listener on disconnect. */
export function bindUI(root, onAction = () => {}) {
  const handleClick = event => {
    const target = event.target.closest?.('button');
    if (!target || !root.contains(target) || target.disabled) return;
    if (target.dataset.ui === 'collapse') {
      const content = root.getElementById(target.getAttribute('aria-controls'));
      if (!content) return;
      const expanded = target.getAttribute('aria-expanded') !== 'true';
      target.setAttribute('aria-expanded', String(expanded));
      content.hidden = !expanded;
      target.querySelector('.chevron')?.classList.toggle('expanded', expanded);
      return;
    }
    if (target.dataset.ui === 'close-dialog') {
      target.closest('dialog')?.close();
      return;
    }
    if (!target.hasAttribute('data-action')) return;
    // Controlled components: the integration decides whether to commit the change.
    const checked = target.getAttribute('role') === 'switch' ? target.getAttribute('aria-checked') !== 'true' : undefined;
    onAction({action:target.dataset.action, data:{...target.dataset}, checked, element:target, originalEvent:event});
  };
  root.addEventListener('click', handleClick);
  const handleKeydown = event => {
    if (event.key !== 'Tab') return;
    const modal = event.target.closest?.('dialog[open]');
    if (!modal) return;
    const controls = [...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && event.target === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first?.focus(); }
  };
  root.addEventListener('keydown', handleKeydown);
  return () => { root.removeEventListener('click', handleClick); root.removeEventListener('keydown', handleKeydown); };
}
