'use strict';
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'collapse45_reviewed_v2';
const markersKey = 'collapse45_marker_positions_v2';
const checksKey = 'collapse45_checks_v2';
const modes = ['driver','passenger','front','rear'];
const defaultMarkers = {
  driver: [
    ['L1',31,54],['L2',37,54],['L3',46,54],['L4',54,54],['L5',63,54],['L6',72,44],['L7',78,44],['L8',90,54],['L9',94,60]
  ],
  passenger: [
    ['R1',29,53],['R2',37,45],['R3',44,45],['R4',51,54],['R5',59,54],['R6',66,54],['R7',75,54],['R8',85,54],['R9',94,60]
  ],
  front: [['CAB',50,52]],
  rear: [['REAR',50,53]]
};
let data, items = [], view='driver', page='map', selected='', calibrating=false, checking=false, positions={}, checked={};
function readStorage(key, fallback) {try { const value=JSON.parse(localStorage.getItem(key));return value ?? fallback;}catch{return fallback;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{alert('This browser could not save locally. Use export to preserve your changes.');}}
function saveItems(){store(storageKey,items);}
function downloadJSON(name,obj){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function setPage(name){page=name;document.querySelectorAll('.page').forEach(el=>el.classList.toggle('hidden',el.id!=='page-'+name));document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===name));if(name==='list')renderList();if(name!=='map')closeDrawer();}
function setView(name){if(!modes.includes(name))return;view=name;document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('selected',el.dataset.view===name));$('rigImage').src=data.rigViews[name];$('rigImage').alt='Collapse 45 '+name+' view';selected='';closeDrawer();renderMarkers();}
function mapMarkers(){return defaultMarkers[view].map(([id,x,y])=>({id,x:positions[view]?.[id]?.x??x,y:positions[view]?.[id]?.y??y}));}
function renderMarkers(){const container=$('hotspots');container.replaceChildren();mapMarkers().forEach(marker=>{const el=document.createElement('button');el.type='button';el.className='hotspot'+(calibrating?' calibrating':'')+(selected===marker.id?' active':'');el.textContent=marker.id;el.title=calibrating?'Drag marker to the matching door (provisional)':`Open ${marker.id} (placement provisional)`;el.setAttribute('aria-label',`Compartment ${marker.id}`);el.style.left=marker.x+'%';el.style.top=marker.y+'%';let dragging=false;el.addEventListener('pointerdown',e=>{if(!calibrating)return;dragging=true;el.setPointerCapture(e.pointerId);e.preventDefault();});el.addEventListener('pointermove',e=>{if(!dragging||!calibrating)return;const rect=container.getBoundingClientRect();const x=Math.max(2,Math.min(98,100*(e.clientX-rect.left)/rect.width));const y=Math.max(9,Math.min(91,100*(e.clientY-rect.top)/rect.height));el.style.left=x+'%';el.style.top=y+'%';positions[view] ??={};positions[view][marker.id]={x:+x.toFixed(2),y:+y.toFixed(2)};});el.addEventListener('pointerup',()=>{if(dragging){dragging=false;store(markersKey,positions);$('mapStatus').textContent='Marker saved on this device. Physical location still needs verification.';}});el.addEventListener('click',()=>{if(!calibrating)openDrawer(marker.id);});container.append(el);});}
function openDrawer(id){selected=id;renderMarkers();$('drawerId').textContent=id;$('drawerTitle').textContent=id==='CAB'?'Cab':id==='REAR'?'Rear access':`Compartment ${id}`;$('drawerSubtitle').textContent='Position pending field verification';$('drawer').classList.remove('hidden');$('scrim').classList.remove('hidden');renderCompartment();}
function closeDrawer(){$('drawer').classList.add('hidden');$('scrim').classList.add('hidden');selected='';if(data)renderMarkers();}
function filteredByComp(){return items.filter(x=>String(x.compartment).trim().toUpperCase()===selected);}
function itemKey(x){return [x.compartment,x.name,x.location,x.source].join('|');}
function renderCompartmentPhoto(){
  // The photo belongs *inside* the scrollable drawer content, above the banner.
  const content = $('drawer').querySelector('.drawer-content');
  let wrap = $('compartmentPhotoWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'compartmentPhotoWrap';
    wrap.className = 'compartment-photo-wrap';
  }
  if (wrap.parentElement !== content || content.firstElementChild !== wrap) {
    content.prepend(wrap);
  }
  let img = $('compartmentPhoto');
  if (!img) {
    img = document.createElement('img');
    img.id = 'compartmentPhoto';
    wrap.append(img);
  }
  const path = data?.compartmentPhotos?.[selected];
  wrap.classList.toggle('hidden', !path);
  if (!path) {
    img.removeAttribute('src');
    return;
  }
  img.alt = `Photo of compartment ${selected}`;
  img.onerror = () => {
    wrap.classList.add('hidden');
    console.warn(`Compartment photo could not load: ${path}`);
  };
  img.onload = () => wrap.classList.remove('hidden');
  img.src = path;
  img.onclick = () => showPhoto(path);
}

function renderCompartment(){
  renderCompartmentPhoto();
  const list = filteredByComp();
  const container = $('compartmentItems');
  if (!list.length) {
    container.innerHTML = '<div class="empty">Equipment list not entered for this compartment yet.</div>';
    return;
  }
  // Preserve the inventory sheet order within each shelf; show no status or notes.
  const sections = new Map();
  list.forEach(item => {
    const shelf = String(item.location || 'Equipment').trim() || 'Equipment';
    if (!sections.has(shelf)) sections.set(shelf, []);
    sections.get(shelf).push(item);
  });
  container.innerHTML = [...sections].map(([shelf, records]) => `
    <section class="equipment-shelf" style="margin:0 0 22px">
      <h3 style="color:#f04438;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin:16px 0 10px">${escapeHtml(shelf)}</h3>
      ${records.map(x => `
        <div class="check-line" style="padding:7px 0;align-items:center">
          ${checking ? `<input type="checkbox" data-check="${escapeHtml(itemKey(x))}" ${checked[itemKey(x)] ? 'checked' : ''}>` : ''}
          <label style="font-weight:400;line-height:1.45">${escapeHtml(x.quantity == null ? '' : `${x.quantity} × `)}${escapeHtml(x.name)}</label>
        </div>`).join('')}
    </section>`).join('');
  container.querySelectorAll('[data-check]').forEach(el => el.addEventListener('change', () => {
    checked[el.dataset.check] = el.checked;
    store(checksKey, checked);
  }));
}
function renderList(){const q=$('globalSearch').value.toLowerCase().trim();const list=items.filter(x=>Object.values(x).some(v=>String(v??'').toLowerCase().includes(q)));$('listResults').innerHTML=list.length?list.map(x=>`<article class="record"><strong>${escapeHtml(x.name)}</strong><p>${escapeHtml(x.compartment)} · ${escapeHtml(x.location||'Shelf unconfirmed')} · Qty: ${escapeHtml(x.quantity??'unconfirmed')}</p><small>${escapeHtml(x.status||'Listed — unverified')} · Source: ${escapeHtml(x.source||'Not linked')}</small>${x.notes?`<p>${escapeHtml(x.notes)}</p>`:''}</article>`).join(''):`<div class="empty">${q?'No matching equipment records.':'No reviewed equipment records yet. The photographed inventory sheets are available in Specs.'}</div>`;}
function showPhoto(path){$('viewerImg').src=path;$('viewerCaption').textContent=path.split('/').pop();$('viewer').showModal();}
function renderGallery(id,paths){const target=$(id);target.replaceChildren();paths.forEach((path,i)=>{const button=document.createElement('button');button.className='photo';const image=document.createElement('img');image.src=path;image.loading='lazy';image.alt='Source photo '+(i+1);const text=document.createElement('span');text.textContent=path.split('/').pop();button.append(image,text);button.addEventListener('click',()=>showPhoto(path));target.append(button);});}
function init(){positions=readStorage(markersKey,{});checked=readStorage(checksKey,{});const saved=readStorage(storageKey,null);items=Array.isArray(saved)?saved:(Array.isArray(data.items)?data.items:[]);renderGallery('photos',data.photos||[]);renderGallery('sheetsGrid',data.sourceSheets||[]);const select=$('compartmentSelect');['L1','L2','L3','L4','L5','L6','L7','L8','L9','R1','R2','R3','R4','R5','R6','R7','R8','R9','CAB','REAR'].forEach(id=>{const op=document.createElement('option');op.textContent=id;op.value=id;select.append(op);});document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>setPage(b.dataset.page));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('calibrateBtn').onclick=()=>{calibrating=!calibrating;$('calibrateBtn').textContent=calibrating?'✓ Done calibrating':'♧ Calibrate';$('resetMap').classList.toggle('hidden',!calibrating);$('mapStatus').textContent=calibrating?'Drag provisional markers to the real compartment doors.':'Select a compartment to view details.';closeDrawer();renderMarkers();};$('resetMap').onclick=()=>{if(!confirm('Reset marker positions for the current view?'))return;delete positions[view];store(markersKey,positions);renderMarkers();};$('closeDrawer').onclick=closeDrawer;$('scrim').onclick=closeDrawer;$('checkToggle').onclick=()=>{checking=!checking;$('checkToggle').textContent=checking?'✓ Exit check mode':'☑ Check mode';$('checkToggle').classList.toggle('active',checking);if(selected)renderCompartment();};$('checkAll').onclick=()=>{filteredByComp().forEach(x=>{checked[itemKey(x)]=true});store(checksKey,checked);renderCompartment();};$('clearChecks').onclick=()=>{filteredByComp().forEach(x=>{delete checked[itemKey(x)]});store(checksKey,checked);renderCompartment();};$('printComp').onclick=()=>window.print();$('printBtn').onclick=()=>window.print();$('themeBtn').onclick=()=>document.body.classList.toggle('light');$('addHere').onclick=()=>{const id=selected;setPage('list');$('compartmentSelect').value=id;$('entryForm').closest('details').open=true;$('entryForm').elements.namedItem('name').focus();};$('entryForm').onsubmit=e=>{e.preventDefault();const record=Object.fromEntries(new FormData(e.target));record.quantity=record.quantity===''?null:Number(record.quantity);if(!record.name?.trim())return;items.push(record);saveItems();e.target.reset();renderList();alert('Saved on this device. This is not a shared or approved apparatus inventory.');};$('globalSearch').addEventListener('input',()=>{if($('globalSearch').value.trim())setPage('list');renderList();});$('exportItems').onclick=()=>downloadJSON('collapse45_reviewed_equipment.json',{apparatus:'Collapse 45',unit:'3306',items});$('importItems').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const payload=JSON.parse(await file.text());if(!Array.isArray(payload.items))throw Error('Expected a JSON object with an items array');if(!confirm('Replace all equipment records saved in this browser with these imported records?'))return;items=payload.items;saveItems();renderList();}catch(err){alert('Import failed: '+err.message)}finally{e.target.value='';}};$('closeViewer').onclick=()=>$('viewer').close();document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});setView('driver');renderList();}
fetch('inventory.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(value=>{data=value;if(!data.rigViews)throw Error('Missing rigViews');init();}).catch(err=>{document.querySelector('.info-bar').textContent='Unable to load inventory.json ('+err.message+'). Use GitHub Pages or run a local web server in this folder.';});
