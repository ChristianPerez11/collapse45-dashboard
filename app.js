'use strict';
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'collapse45_reviewed_v2';
const markersKey = 'collapse45_marker_positions_v2';
const checksKey = 'collapse45_checks_v2';
const modes = ['driver','passenger','front','rear'];
const defaultMarkers = {
  "driver": [
    [
      "L1",
      29.45,
      46.23
    ],
    [
      "L2",
      35.49,
      46.77
    ],
    [
      "L3",
      41.98,
      67.44
    ],
    [
      "L4",
      49.67,
      66.89
    ],
    [
      "L5",
      57.36,
      66.89
    ],
    [
      "L6",
      64.95,
      66.89
    ],
    [
      "L7",
      73.08,
      51.12
    ],
    [
      "L8",
      81.65,
      51.12
    ],
    [
      "L9",
      90.55,
      66.89
    ]
  ],
  "passenger": [
    [
      "R1",
      67.69,
      43.31
    ],
    [
      "R2",
      61.54,
      43.31
    ],
    [
      "R3",
      55.05,
      63.88
    ],
    [
      "R4",
      47.58,
      63.88
    ],
    [
      "R5",
      40.33,
      63.88
    ],
    [
      "R6",
      33.08,
      63.88
    ],
    [
      "R7",
      25.6,
      44.39
    ],
    [
      "R8",
      18.57,
      44.39
    ],
    [
      "R9",
      11.1,
      63.88
    ]
  ],
  "front": [
    [
      "CAB",
      50.73,
      31.24
    ]
  ],
  "rear": [
    [
      "REAR",
      52.63,
      32.74
    ]
  ]
};
let data, items = [], view='driver', page='map', selected='', calibrating=false, checking=false, positions={}, checked={};
function readStorage(key, fallback) {try { const value=JSON.parse(localStorage.getItem(key));return value ?? fallback;}catch{return fallback;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{alert('This browser could not save locally. Use export to preserve your changes.');}}
function saveItems(){store(storageKey,items);}
function downloadJSON(name,obj){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function setPage(name){page=name;document.querySelectorAll('.page').forEach(el=>el.classList.toggle('hidden',el.id!=='page-'+name));document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===name));if(name==='list')renderList();if(name!=='map')closeDrawer();}
function setView(name){if(!modes.includes(name))return;view=name;document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('selected',el.dataset.view===name));$('rigImage').src=data.rigViews[name];$('rigImage').alt='Collapse 45 '+name+' view';selected='';closeDrawer();renderMarkers();}
function mapMarkers(){return defaultMarkers[view].map(([id,x,y])=>({id,x:positions[view]?.[id]?.x??x,y:positions[view]?.[id]?.y??y}));}
function renderMarkers(){const container=$('hotspots');container.replaceChildren();mapMarkers().forEach(marker=>{const el=document.createElement('button');el.type='button';el.className='hotspot'+(calibrating?' calibrating':'')+(selected===marker.id?' active':'');el.textContent=marker.id;el.title=calibrating?'Drag marker to the corresponding compartment door':`Open ${marker.id}`;el.setAttribute('aria-label',`Compartment ${marker.id}`);el.style.left=marker.x+'%';el.style.top=marker.y+'%';let dragging=false;el.addEventListener('pointerdown',e=>{if(!calibrating)return;dragging=true;el.setPointerCapture(e.pointerId);e.preventDefault();});el.addEventListener('pointermove',e=>{if(!dragging||!calibrating)return;const rect=container.getBoundingClientRect();const x=Math.max(2,Math.min(98,100*(e.clientX-rect.left)/rect.width));const y=Math.max(9,Math.min(91,100*(e.clientY-rect.top)/rect.height));el.style.left=x+'%';el.style.top=y+'%';positions[view] ??={};positions[view][marker.id]={x:+x.toFixed(2),y:+y.toFixed(2)};});el.addEventListener('pointerup',()=>{if(dragging){dragging=false;store(markersKey,positions);$('mapStatus').textContent='Marker position saved in this browser.';}});el.addEventListener('click',()=>{if(!calibrating)openDrawer(marker.id);});container.append(el);});}
function openDrawer(id){selected=id;renderMarkers();$('drawerId').textContent=id;$('drawerTitle').textContent=id==='CAB'?'Cab':id==='REAR'?'Rear access':`Compartment ${id}`;$('drawerSubtitle').textContent='Inventory reference · 09/19/2026';$('drawer').classList.remove('hidden');$('scrim').classList.remove('hidden');renderCompartment();}
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
    <section class="equipment-shelf">
      <h3 class="equipment-shelf-title">${escapeHtml(shelf)}</h3>
      <div class="equipment-shelf-list">${records.map(x => `
        <div class="check-line equipment-row">
          ${checking ? `<input type="checkbox" aria-label="Check ${escapeHtml(x.name)}" data-check="${escapeHtml(itemKey(x))}" ${checked[itemKey(x)] ? 'checked' : ''}>` : ''}
          <label>${escapeHtml(x.quantity == null ? '' : `${x.quantity} × `)}${escapeHtml(x.name)}</label>
        </div>`).join('')}</div>
    </section>`).join('');
  container.querySelectorAll('[data-check]').forEach(el => el.addEventListener('change', () => {
    checked[el.dataset.check] = el.checked;
    store(checksKey, checked);
  }));
}
// Compact equipment finder. Filters apply to the currently loaded (possibly Excel-imported) records.
let listCompartment='ALL', listSort='compartment';
function renderList(){
  const q=$('globalSearch').value.toLowerCase().trim();
  const filtered=items.filter(x=>{
    const compartment=String(x.compartment??'').trim().toUpperCase();
    if(listCompartment!=='ALL' && compartment!==listCompartment)return false;
    return !q || [x.name,x.compartment,x.location,x.kit].some(v=>String(v??'').toLowerCase().includes(q));
  });
  const compartmentRank=id=>{
    const match=/^([LR])(\d+)$/.exec(String(id??'').toUpperCase());
    return match?(match[1]==='L'?0:100)+Number(match[2]):id==='CAB'?200:id==='REAR'?201:999;
  };
  filtered.sort((a,b)=>{
    if(listSort==='name')return String(a.name??'').localeCompare(String(b.name??'')) || compartmentRank(a.compartment)-compartmentRank(b.compartment);
    if(listSort==='location')return String(a.location??'').localeCompare(String(b.location??'')) || String(a.name??'').localeCompare(String(b.name??''));
    return compartmentRank(a.compartment)-compartmentRank(b.compartment) || String(a.location??'').localeCompare(String(b.location??'')) || String(a.name??'').localeCompare(String(b.name??''));
  });
  $('listCount').textContent=`${filtered.length} of ${items.length} equipment records`;
  $('listResults').innerHTML=filtered.length?`<div class="inventory-table-scroll"><table class="inventory-table"><thead><tr><th scope="col">Equipment</th><th scope="col">Compartment</th><th scope="col">Shelf / location</th><th scope="col">Qty</th><th scope="col"><span class="sr-only">Open</span></th></tr></thead><tbody>${filtered.map(x=>{
    const compartment=String(x.compartment??'').trim().toUpperCase();
    const linked=['L1','L2','L3','L4','L5','L6','L7','L8','L9','R1','R2','R3','R4','R5','R6','R7','R8','R9','CAB','REAR'].includes(compartment);
    return `<tr><td>${escapeHtml(x.name??'Unnamed equipment')}</td><td>${escapeHtml(compartment||'—')}</td><td>${escapeHtml(x.location||'—')}</td><td class="qty">${escapeHtml(x.quantity??'—')}</td><td>${linked?`<button type="button" class="inventory-open" data-open-compartment="${escapeHtml(compartment)}" aria-label="Open compartment ${escapeHtml(compartment)}">View</button>`:''}</td></tr>`;
  }).join('')}</tbody></table></div>`:`<div class="empty">No equipment matches your search and compartment filter.</div>`;
  $('listResults').querySelectorAll('[data-open-compartment]').forEach(btn=>btn.addEventListener('click',()=>{
    const compartment=btn.dataset.openCompartment;
    const next=compartment.startsWith('L')?'driver':compartment.startsWith('R')?'passenger':compartment==='CAB'?'front':'rear';
    setPage('map');setView(next);openDrawer(compartment);
  }));
}

function showPhoto(path){$('viewerImg').src=path;$('viewerCaption').textContent=path.split('/').pop();$('viewer').showModal();}
function renderGallery(id,paths){const target=$(id);target.replaceChildren();paths.forEach((path,i)=>{const button=document.createElement('button');button.className='photo';const image=document.createElement('img');image.src=path;image.loading='lazy';image.alt='Source photo '+(i+1);const text=document.createElement('span');text.textContent=path.split('/').pop();button.append(image,text);button.addEventListener('click',()=>showPhoto(path));target.append(button);});}
function init(){ $('listCompartment').addEventListener('change',e=>{listCompartment=e.target.value;renderList();});$('listSort').addEventListener('change',e=>{listSort=e.target.value;renderList();});$('clearListFilters').addEventListener('click',()=>{listCompartment='ALL';listSort='compartment';$('listCompartment').value='ALL';$('listSort').value='compartment';$('globalSearch').value='';renderList();});positions=readStorage(markersKey,{});checked=readStorage(checksKey,{});const saved=readStorage(storageKey,null);items=Array.isArray(saved)?saved:(Array.isArray(data.items)?data.items:[]);renderGallery('photos',data.photos||[]);renderGallery('sheetsGrid',data.sourceSheets||[]);const select=$('compartmentSelect');['L1','L2','L3','L4','L5','L6','L7','L8','L9','R1','R2','R3','R4','R5','R6','R7','R8','R9','CAB','REAR'].forEach(id=>{const op=document.createElement('option');op.textContent=id;op.value=id;select.append(op);});document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>setPage(b.dataset.page));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('calibrateBtn').onclick=()=>{calibrating=!calibrating;$('calibrateBtn').textContent=calibrating?'✓ Done calibrating':'♧ Calibrate';$('resetMap').classList.toggle('hidden',!calibrating);$('mapStatus').textContent=calibrating?'Drag markers to their compartment doors.':'Select a compartment to view its inventory.';closeDrawer();renderMarkers();};$('resetMap').onclick=()=>{if(!confirm('Reset marker positions for the current view?'))return;delete positions[view];store(markersKey,positions);renderMarkers();};$('closeDrawer').onclick=closeDrawer;$('scrim').onclick=closeDrawer;$('checkToggle').onclick=()=>{checking=!checking;$('checkToggle').textContent=checking?'✓ Exit check mode':'☑ Check mode';$('checkToggle').classList.toggle('active',checking);if(selected)renderCompartment();};$('checkAll').onclick=()=>{filteredByComp().forEach(x=>{checked[itemKey(x)]=true});store(checksKey,checked);renderCompartment();};$('clearChecks').onclick=()=>{filteredByComp().forEach(x=>{delete checked[itemKey(x)]});store(checksKey,checked);renderCompartment();};$('printComp').onclick=()=>window.print();$('printBtn').onclick=()=>window.print();$('themeBtn').onclick=()=>document.body.classList.toggle('light');$('addHere').onclick=()=>{const id=selected;setPage('list');$('compartmentSelect').value=id;$('entryForm').closest('details').open=true;$('entryForm').elements.namedItem('name').focus();};$('entryForm').onsubmit=e=>{e.preventDefault();const record=Object.fromEntries(new FormData(e.target));record.quantity=record.quantity===''?null:Number(record.quantity);if(!record.name?.trim())return;items.push(record);saveItems();e.target.reset();renderList();alert('Saved on this device. This is not a shared or approved apparatus inventory.');};$('globalSearch').addEventListener('input',()=>{if($('globalSearch').value.trim())setPage('list');renderList();});$('exportItems').onclick=()=>downloadJSON('collapse45_reviewed_equipment.json',{apparatus:'Collapse 45',unit:'3306',items});$('importItems').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const payload=JSON.parse(await file.text());if(!Array.isArray(payload.items))throw Error('Expected a JSON object with an items array');if(!confirm('Replace all equipment records saved in this browser with these imported records?'))return;items=payload.items;saveItems();renderList();}catch(err){alert('Import failed: '+err.message)}finally{e.target.value='';}};$('closeViewer').onclick=()=>$('viewer').close();document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});setView('driver');renderList();initExcelImport();}
fetch('inventory.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(value=>{data=value;if(!data.rigViews)throw Error('Missing rigViews');init();}).catch(err=>{document.querySelector('.info-bar').textContent='Unable to load inventory.json ('+err.message+'). Use GitHub Pages or run a local web server in this folder.';});

// Collapse 45 Excel / CSV import. Local-only: no uploads or external libraries.
'use strict';
const C45_ALLOWED_COMPARTMENTS = new Set([...Array.from({length:9},(_,i)=>'L'+(i+1)),...Array.from({length:9},(_,i)=>'R'+(i+1)),'CAB','REAR']);
const C45_HEADERS = {
  compartment:['compartment','compartment id','compartment number','comp'],
  name:['equipment name','equipment','name','item','item name','description'],
  quantity:['quantity','qty','count','number'],
  location:['shelf / location','shelf/location','shelf','location','storage location'],
  kit:['kit','subkit','group'], source:['source photograph','source photo','source','photograph'],
  sharedWith:['shared with','sharedwith'], sharedInventoryReference:['shared reference','shared inventory reference']
};
const c45Norm = s => String(s??'').toLowerCase().trim().replace(/\s+/g,' ');
const c45Text = s => String(s??'').trim();
const c45Esc = s => escapeHtml(s);
function c45Xml(text){const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Invalid Excel worksheet XML.');return doc;}
function c45Child(el,name){return Array.from(el.children||[]).find(x=>x.localName===name);}
function c45Children(el,name){return Array.from(el.children||[]).filter(x=>x.localName===name);}
function c45AllText(el){return Array.from(el?.getElementsByTagName('*')||[]).filter(x=>x.localName==='t').map(x=>x.textContent).join('');}
function c45ColIndex(cellRef){const letters=(cellRef.match(/^[A-Za-z]+/)||[''])[0].toUpperCase();let n=0;for(const c of letters)n=n*26+c.charCodeAt(0)-64;return n-1;}
function c45ZipEntries(bytes){
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65558);i--){if(v.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw Error('This is not a valid .xlsx file (ZIP directory not found).');
  const count=v.getUint16(eocd+10,true), offset=v.getUint32(eocd+16,true);
  if(count===65535||offset===0xffffffff)throw Error('ZIP64 Excel files are not supported; save a standard .xlsx workbook.');
  const entries=new Map();let p=offset;
  for(let i=0;i<count;i++){
    if(v.getUint32(p,true)!==0x02014b50)throw Error('The workbook ZIP directory is damaged.');
    const method=v.getUint16(p+10,true),size=v.getUint32(p+20,true),nameLen=v.getUint16(p+28,true),extraLen=v.getUint16(p+30,true),commentLen=v.getUint16(p+32,true),local=v.getUint32(p+42,true);
    const name=new TextDecoder().decode(bytes.subarray(p+46,p+46+nameLen));
    if(name.includes('..'))throw Error('Unsafe workbook path.');
    entries.set(name,{method,size,local});p+=46+nameLen+extraLen+commentLen;
  }
  async function read(name){
    const entry=entries.get(name);if(!entry)throw Error('Missing workbook part: '+name);
    const p=entry.local;if(v.getUint32(p,true)!==0x04034b50)throw Error('Damaged workbook ZIP entry.');
    const start=p+30+v.getUint16(p+26,true)+v.getUint16(p+28,true);
    const compressed=bytes.slice(start,start+entry.size);
    if(entry.method===0)return new TextDecoder().decode(compressed);
    if(entry.method!==8)throw Error('Unsupported workbook ZIP compression.');
    if(typeof DecompressionStream==='undefined')throw Error('Excel import requires a recent Chrome or Edge browser.');
    const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(await new Response(stream).arrayBuffer());
  }
  return {entries,read};
}
async function c45ReadXlsx(file){
  const bytes=new Uint8Array(await file.arrayBuffer()), zip=c45ZipEntries(bytes);
  const wb=c45Xml(await zip.read('xl/workbook.xml'));
  const rels=c45Xml(await zip.read('xl/_rels/workbook.xml.rels'));
  const maps=new Map(Array.from(rels.getElementsByTagName('*')).filter(x=>x.localName==='Relationship').map(x=>[x.getAttribute('Id'),x.getAttribute('Target')]));
  const sheets=Array.from(wb.getElementsByTagName('*')).filter(x=>x.localName==='sheet');
  if(!sheets.length)throw Error('Workbook has no worksheets.');
  const sheet=sheets.find(x=>/^(inventory|equipment|equipment inventory)$/i.test(x.getAttribute('name')||''))||sheets[0];
  const rid=Array.from(sheet.attributes).find(x=>x.localName==='id')?.value;
  const target=maps.get(rid);if(!target)throw Error('Cannot locate the Inventory worksheet.');
  const path=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target;
  let strings=[];
  if(zip.entries.has('xl/sharedStrings.xml')){
    const shared=c45Xml(await zip.read('xl/sharedStrings.xml'));
    strings=Array.from(shared.getElementsByTagName('*')).filter(x=>x.localName==='si').map(x=>c45AllText(x));
  }
  const doc=c45Xml(await zip.read(path));
  const rows=Array.from(doc.getElementsByTagName('*')).filter(x=>x.localName==='row').map(row=>{
    const values=[];
    c45Children(row,'c').forEach(cell=>{
      const col=c45ColIndex(cell.getAttribute('r')||'');if(col<0||col>100) return;
      const type=cell.getAttribute('t');const v=c45Child(cell,'v')?.textContent??'';
      values[col]=type==='s'?strings[Number(v)]??'':type==='inlineStr'?c45AllText(c45Child(cell,'is')):type==='b'?(v==='1'):v;
    });
    return {line:Number(row.getAttribute('r'))||0,values};
  });
  return {rows,sheet:sheet.getAttribute('name')||'Sheet1'};
}
function c45ReadCsv(text){
  text=text.replace(/^\uFEFF/,'');const records=[];let row=[],value='',quoted=false,line=1,recordLine=1;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){value+='"';i++;}else if(ch==='"')quoted=false;else{value+=ch;if(ch==='\n')line++;}}
    else if(ch==='"')quoted=true;
    else if(ch===','){row.push(value);value='';}
    else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(value);records.push({line:recordLine,values:row});row=[];value='';line++;recordLine=line;
    }else value+=ch;
  }
  if(quoted)throw Error('CSV contains an unterminated quoted value.');
  if(value!==''||row.length){row.push(value);records.push({line:recordLine,values:row});}
  return {rows:records,sheet:'CSV'};
}
function c45MapRows(source){
  const rows=source.rows;
  const headerIndex=rows.findIndex(r=>r.values.some(x=>C45_HEADERS.compartment.includes(c45Norm(x)))&&r.values.some(x=>C45_HEADERS.name.includes(c45Norm(x))));
  if(headerIndex<0)throw Error('Missing header row. Required: Compartment, Equipment Name, Quantity, Shelf / Location.');
  const header=rows[headerIndex].values.map(c45Norm);
  const col={};for(const [key,names] of Object.entries(C45_HEADERS))col[key]=header.findIndex(h=>names.includes(h));
  for(const key of ['compartment','name','quantity','location'])if(col[key]<0)throw Error('Missing required column: '+key+'.');
  const errors=[],records=[];
  for(const row of rows.slice(headerIndex+1)){
    const get=key=>col[key]<0?'':row.values[col[key]];
    if(!row.values.some(x=>c45Text(x)!==''))continue;
    const compartment=c45Text(get('compartment')).toUpperCase(),name=c45Text(get('name'));
    const quantityValue=c45Text(get('quantity')), location=c45Text(get('location'));
    if(!C45_ALLOWED_COMPARTMENTS.has(compartment)){errors.push(`Row ${row.line}: invalid compartment "${compartment}".`);continue;}
    if(!name){errors.push(`Row ${row.line}: equipment name is missing.`);continue;}
    if(!location){errors.push(`Row ${row.line}: shelf/location is missing.`);continue;}
    if(quantityValue.length>80||/^-[0-9]/.test(quantityValue)||(/^[0-9]+$/.test(quantityValue)&&Number(quantityValue)>1000000)){errors.push(`Row ${row.line}: invalid quantity.`);continue;}
    const entry={name,quantity:quantityValue===''?null:/^[0-9]+$/.test(quantityValue)?Number(quantityValue):quantityValue,compartment,location};
    if(c45Text(get('kit')))entry.kit=c45Text(get('kit'));
    if(c45Text(get('source')))entry.source=c45Text(get('source'));
    if(c45Text(get('sharedWith')))entry.sharedWith=c45Text(get('sharedWith')).toUpperCase();
    const shared=c45Norm(get('sharedInventoryReference'));
    if(['true','yes','1','y'].includes(shared))entry.sharedInventoryReference=true;
    records.push(entry);
  }
  if(!records.length)throw Error('No valid inventory rows were found.');
  return {records,errors,sheet:source.sheet};
}
function c45Diff(before,after){
  const key=x=>[x.compartment,c45Norm(x.name),c45Norm(x.location),c45Norm(x.kit),c45Norm(x.sharedWith),x.sharedInventoryReference?'shared':''].join('|');
  const bag=arr=>{const m=new Map();arr.forEach(x=>{const k=key(x);if(!m.has(k))m.set(k,[]);m.get(k).push(x);});return m;};
  const a=bag(before),b=bag(after),changes=[];let added=0,removed=0,changed=0,unchanged=0;
  for(const k of new Set([...a.keys(),...b.keys()])){
    const old=a.get(k)||[],neu=b.get(k)||[];
    for(let i=0;i<Math.max(old.length,neu.length);i++){
      const x=old[i],y=neu[i];
      if(!x){added++;changes.push({type:'Added',item:y});}
      else if(!y){removed++;changes.push({type:'Removed',item:x});}
      else if(x.quantity!==y.quantity||c45Text(x.source)!==c45Text(y.source)){
        changed++;changes.push({type:'Changed',item:y,from:x});
      }else unchanged++;
    }
  }
  return {added,removed,changed,unchanged,changes};
}
function c45ClosePreview(){c45Pending=null;$('excelPreview').close();$('excelFile').value='';}
let c45Pending=null;
function initExcelImport(){
  const input=$('excelFile'), dialog=$('excelPreview'),stats=$('excelStats'),detail=$('excelDetails'),apply=$('excelApply');
  input.addEventListener('change',async()=>{
    const file=input.files?.[0];if(!file)return;
    c45Pending=null;apply.disabled=true;
    dialog.showModal();stats.textContent='Reading and validating '+file.name+'…';detail.replaceChildren();
    try{
      if(file.size>15*1024*1024)throw Error('File exceeds 15 MB.');
      const ext=file.name.split('.').pop().toLowerCase();
      const parsed=ext==='csv'?c45ReadCsv(await file.text()):ext==='xlsx'?await c45ReadXlsx(file):null;
      if(!parsed)throw Error('Select a .xlsx or .csv file. Old .xls files must be saved as .xlsx.');
      const {records,errors,sheet}=c45MapRows(parsed);
      const diff=c45Diff(items,records);
      stats.innerHTML=`<strong>${c45Esc(file.name)}</strong> · Sheet: ${c45Esc(sheet)}<div class="excel-summary"><span>${records.length} rows</span><span>${diff.added} added</span><span>${diff.changed} changed</span><span>${diff.removed} removed</span><span>${diff.unchanged} unchanged</span></div>`;
      if(errors.length){
        const box=document.createElement('div');box.className='excel-errors';box.innerHTML=`<strong>Import blocked: ${errors.length} invalid row(s)</strong><ul>${errors.slice(0,35).map(x=>`<li>${c45Esc(x)}</li>`).join('')}</ul>${errors.length>35?'<p>Additional errors not shown.</p>':''}`;detail.append(box);
      }else{
        const warning=document.createElement('p');warning.className='muted';warning.textContent='Preview only. Confirming replaces the equipment inventory saved in this browser. Photographs, apparatus views, and marker positions are not changed. GitHub is NOT updated automatically.';detail.append(warning);
        const table=document.createElement('div');table.className='excel-diff';
        if(diff.changes.length){table.innerHTML=`<table><thead><tr><th>Change</th><th>Compartment</th><th>Equipment</th><th>Qty</th></tr></thead><tbody>${diff.changes.slice(0,100).map(x=>`<tr><td>${x.type}</td><td>${c45Esc(x.item.compartment)}</td><td>${c45Esc(x.item.name)}</td><td>${x.from?c45Esc(x.from.quantity??'—')+' → ':''}${c45Esc(x.item.quantity??'—')}</td></tr>`).join('')}</tbody></table>${diff.changes.length>100?`<p class="muted">Showing first 100 of ${diff.changes.length} changes.</p>`:''}`;}
        else table.textContent='No changes found.';
        detail.append(table);c45Pending=records;apply.disabled=false;
      }
    }catch(err){stats.textContent='Import failed';const box=document.createElement('p');box.className='excel-errors';box.textContent=err.message;detail.append(box);}
  });
  $('excelCancel').onclick=c45ClosePreview;
  dialog.addEventListener('cancel',()=>{c45Pending=null;input.value='';});
  apply.onclick=()=>{
    if(!c45Pending)return;
    const prior=items;
    try{
      const saved=JSON.stringify(c45Pending);localStorage.setItem(storageKey,saved);
      items=c45Pending;c45Pending=null;renderList();if(selected)renderCompartment();
      const full={...data,items};
      downloadJSON('collapse45_inventory_for_github.json',full);
      c45ClosePreview();
      alert('Inventory imported on this browser. A complete inventory JSON file was also downloaded. To share updates or make them permanent in GitHub, back up the repository inventory.json and upload the downloaded file renamed as inventory.json.');
    }catch(err){items=prior;alert('Could not save inventory: '+err.message+'; no changes applied.');}
  };
  $('excelExport').onclick=()=>downloadJSON('collapse45_inventory_for_github.json',{...data,items});
  $('excelTemplate').onclick=()=>{const headers=['Compartment','Equipment Name','Quantity','Shelf / Location','Kit','Source Photograph','Shared With','Shared Reference'];const lines=[headers,...items.map(i=>[i.compartment,i.name,i.quantity??'',i.location??'',i.kit??'',i.source??'',i.sharedWith??'',i.sharedInventoryReference?'Yes':''])];
    const csv=lines.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='collapse45_inventory_template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
}
