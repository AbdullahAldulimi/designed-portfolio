/* Droply 3.0 — GitHub Pages prototype. All shipments and tracking are simulated. */
(() => {
  'use strict';

  const KEY = 'droply_v3_shipments';
  const VERSION = '3.0.2';
  const VEHICLES = {
    ute:   { name: 'Ute / Light',  capacity: 1, base: 38, perKm: 2.15, art: 'ute-art' },
    van:   { name: 'Transit van',  capacity: 6, base: 64, perKm: 3.1,  art: 'van-art' },
    truck: { name: 'Rigid truck',  capacity: 17,base: 105,perKm: 4.55, art: 'truck-art' }
  };
  const STEP_NAMES = ['Requested', 'Driver assigned', 'En route', 'Delivered'];
  const PHOTOS = [
    {label:'Warehouse staging',url:'https://images.unsplash.com/photo-1553413077-190dd305871c?w=620&q=80&auto=format'},
    {label:'Pallet storage',url:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=620&q=80&auto=format'},
    {label:'Goods preparation',url:'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=620&q=80&auto=format'},
    {label:'Distribution facility',url:'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=620&q=80&auto=format'}
  ];
  // Embedded illustrative warehouse artwork is used only if a sample stock photo cannot load.
  function cargoFallback(i){
    const backgrounds=['#6a6762','#5e686c','#73706a','#62686b'];
    const brown=['#b59b77','#c0a481','#a98b67','#b6a07f'];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220">
      <rect width="360" height="220" fill="${backgrounds[i%4]}"/>
      <path d="M0 0h360v65H0Z" fill="#3a4146"/><path d="M0 160h360v60H0Z" fill="#555452"/>
      <path d="M0 160 175 100l185 60" fill="#686663" stroke="#92908b" stroke-width="3"/>
      <g stroke="#343c41" stroke-width="9"><path d="M32 45v145M328 45v145M30 65h300M30 112h300M30 158h300"/></g>
      <g fill="${brown[i%4]}" stroke="#78634e" stroke-width="2">
        <rect x="47" y="73" width="65" height="37"/><rect x="118" y="73" width="68" height="37"/>
        <rect x="193" y="73" width="55" height="37"/><rect x="255" y="73" width="54" height="37"/>
        <rect x="46" y="119" width="78" height="37"/><rect x="132" y="119" width="63" height="37"/>
        <rect x="202" y="119" width="57" height="37"/><rect x="265" y="119" width="42" height="37"/>
      </g><g stroke="#d6c3a6" stroke-width="2" opacity=".4"><path d="M70 73v37M146 73v37M220 73v37M84 119v37M162 119v37M230 119v37"/></g>
      <path d="M157 0h48l-15 23h-17Z" fill="#d5d5c5" opacity=".65"/>
      <rect width="360" height="220" fill="#151b20" opacity=".12"/>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currency = value => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(value)||0);
  const now = () => new Date().toISOString();
  const icon = name => `<svg aria-hidden="true"><use href="#ic-${name}"></use></svg>`;
  const count = num => Number(num).toLocaleString('en-AU');
  const dateText = value => { const d = new Date(value); return Number.isNaN(d.valueOf()) ? 'Demo' : d.toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'}); };

  // Clearly identified fictional sample jobs for UI testing.
  const sample = () => [
    ['SD-752069247','Dandenong South VIC','Port Melbourne VIC',34,10,'Palletised freight','truck',2,'12:35', 'Mixed palletised freight · 10 units'],
    ['XR-93633762','Tullamarine VIC','Campbellfield VIC',18,3,'General freight','van',0,'14:20','Packed commercial supplies'],
    ['AL-11394207','Laverton North VIC','Docklands VIC',29,1,'Furniture','ute',0,'15:00','Small furniture consignment'],
    ['AL-118945307','Clayton VIC','Springvale VIC',12,4,'Equipment','van',3,'10:15','Machinery components'],
    ['SD-752062947','Truganina VIC','Dandenong South VIC',46,9,'Palletised freight','truck',2,'13:45','Nine pallets of general stock'],
    ['SD-752263347','Brooklyn VIC','Moorabbin VIC',22,13,'Palletised freight','truck',2,'16:20','Thirteen pallet units'],
    ['XP-916247621','Keysborough VIC','Scoresby VIC',19,2,'Equipment','van',1,'17:00','Workshop components'],
    ['AL-118134203','Somerton VIC','Melbourne CBD VIC',27,1,'General freight','ute',3,'09:40','Small business shipment']
  ].map(([id,from,to,distance,pallets,type,vehicle,progress,eta,notes],i) => ({
    id,from,to,distance,pallets,type,vehicle,progress,eta,notes,
    price:estimate(vehicle,distance,pallets),created:new Date(Date.now()-(i+1)*86400000).toISOString(),
    sample:true
  }));

  function estimate(vehicle,distance,pallets){
    const v = VEHICLES[vehicle];
    if(!v) return 0;
    return Math.round((v.base+Number(distance)*v.perKm+Math.max(0,Number(pallets)-1)*4)*100)/100;
  }
  function validate(item){
    if(!item || typeof item !== 'object') return null;
    const vehicle=VEHICLES[item.vehicle] ? item.vehicle : 'ute';
    const progress=Math.max(0,Math.min(3,Math.round(Number(item.progress)||0)));
    const pallets=Math.max(1,Math.min(17,Math.round(Number(item.pallets)||1)));
    const distance=Math.max(0,Math.min(2000,Number(item.distance)||0));
    return {
      id:String(item.id || newId()).slice(0,50),from:String(item.from||'Pickup location').slice(0,100),to:String(item.to||'Destination').slice(0,100),
      distance,pallets,type:String(item.type||'General freight').slice(0,60),vehicle,progress,
      eta:String(item.eta||'TBC').slice(0,20),notes:String(item.notes||'').slice(0,500),
      price:Number.isFinite(Number(item.price))?Math.max(0,Number(item.price)):estimate(vehicle,distance,pallets),
      created:String(item.created||now()),sample:Boolean(item.sample)
    };
  }
  let shipments=[];
  let current='SD-752069247';
  let page='dashboard', tab='shipping', filter='all', query='', mapZoom=1;
  let toastTimeout;

  function load(){
    try{
      const stored=localStorage.getItem(KEY);
      if(stored!==null){
        const parsed=JSON.parse(stored);
        if(Array.isArray(parsed)){
          shipments=parsed.map(validate).filter(Boolean);
          current=shipments[0]?.id||null;
          return;
        }
      }
    }catch(e){console.warn('Droply could not read local demo data.',e);}
    shipments=sample();current=shipments[0].id;
    persist();
  }
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(shipments));return true;}
    catch(e){toast('Browser storage is unavailable. Changes may not be saved.');return false;}
  }
  function newId(){
    const a=globalThis.crypto?.randomUUID?.().replaceAll('-','').slice(0,9).toUpperCase()
      || Date.now().toString(36).toUpperCase();
    return `DR-${a}`;
  }
  function selected(){return shipments.find(s=>s.id===current)||shipments[0]||null;}
  function status(p){return STEP_NAMES[p]||STEP_NAMES[0];}
  function statusClass(p){return p===3?'delivered':p===2?'enroute':'waiting';}
  function pill(p){return `<span class="mini-status ${statusClass(p)}">${safe(status(p))}</span>`;}

  function toast(message){
    const el=$('#toast'); if(!el)return;
    clearTimeout(toastTimeout);el.textContent=message;el.classList.add('show');
    toastTimeout=setTimeout(()=>el.classList.remove('show'),3200);
  }

  function visibleItems(){
    return shipments.filter(s=>{
      if(filter==='enroute'&&s.progress!==2)return false;
      if(filter==='waiting'&&s.progress>1)return false;
      if(filter==='delivered'&&s.progress!==3)return false;
      const haystack=`${s.id} ${s.from} ${s.to} ${s.vehicle} ${s.type}`.toLowerCase();
      return haystack.includes(query.toLowerCase().trim());
    });
  }
  function renderQueue(){
    const items=visibleItems();
    $('#shipmentGrid').innerHTML=items.map(s=>{
      const art=VEHICLES[s.vehicle].art;
      return `<button type="button" class="shipment-card ${s.id===current?'selected':''}" data-shipment="${safe(s.id)}" aria-label="View ${safe(s.id)}" aria-pressed="${s.id===current}">
        <span class="shipment-card-top"><span class="shipment-code">${safe(s.id)}</span>${pill(s.progress)}</span>
        <span class="card-meta"><span class="route-name"><strong>From</strong> ${safe(s.from)}</span><span class="route-name"><strong>To</strong> ${safe(s.to)}</span><small>${safe(s.eta)} · ${safe(String(s.distance))} km</small></span>
        <span class="card-vehicle"><svg viewBox="0 0 560 205" aria-hidden="true"><use href="#${art}"></use></svg></span>
        <span class="card-type">${safe(s.type)}</span></button>`;
    }).join('');
    $('#queueEmpty').hidden=items.length!==0;
    $('#resultCount').textContent=count(items.length);
    $('#filterAllCount').textContent=count(shipments.length);
    $('#queueFooterText').textContent=`${items.length} of ${shipments.length} sample / demo shipments`;
    $('#trackingCount').textContent=String(shipments.length);
    $$('.filter-chip').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function navigate(destination){
    page=destination;
    const names={dashboard:['Dashboard','Shipment performance overview'],tracking:['Tracking','Your freight, in one place.'],requests:['Requests','Your shipment queue'],drivers:['Drivers','Assign demo requests'],messages:['Messages','Team communication'],reports:['Reports','Shipment analytics'],billing:['Billing','Estimated delivery costs'],settings:['Settings','Workspace preferences']};
    const n=names[destination]||names.tracking;
    $('#queueTitle').textContent=n[0];$('#queueSubtitle').textContent=n[1];$('#queueCrumb').textContent=n[0].toUpperCase();
    $$('[data-go]').forEach(b=>{const active=b.dataset.go===destination;b.classList.toggle('is-active',active);b.classList.toggle('active',active);if(active){b.setAttribute('aria-current','page')}else{b.removeAttribute('aria-current')}});
    const special=!['tracking','dashboard'].includes(destination);
    $('#specialView').hidden=!special;
    $('#shipmentViews').hidden=special;
    $('.detail-tabs').hidden=special;
    if(special)renderSpecial();else renderDetail();
    renderQueue();
    if(window.innerWidth<=720 && destination==='tracking'){
      // Keep the queue visible first on phones, matching the reference's browsing flow.
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }
  function choose(id){
    if(!shipments.some(s=>s.id===id))return;
    current=id;
    tab='shipping';activateTab('shipping');
    navigate('tracking');
    if(window.innerWidth<=720){$('#detailColumn').scrollIntoView({behavior:'smooth',block:'start'});}
  }
  function activateTab(name){
    if(!['shipping','vehicle','documents','company','billing'].includes(name))return;
    tab=name;
    $$('.detail-tab').forEach(b=>{const a=b.dataset.tab===name;b.classList.toggle('active',a);b.setAttribute('aria-selected',String(a));});
    $$('.detail-view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
    $('#detailScroll').scrollTop=0;
  }

  function renderDetail(){
    const s=selected();
    if(!s){
      $('#selectedId').textContent='No shipments';$('#selectedStatus').textContent='—';
      $('#shipmentViews').innerHTML='<div class="blank-view"><h3>No demo shipments</h3><p>Create a request to get started.</p></div>';
      return;
    }
    $('#selectedId').textContent=s.id;
    $('#selectedStatus').textContent=status(s.progress);
    $('#selectedStatus').className=`status-badge ${statusClass(s.progress)}`;
    const v=VEHICLES[s.vehicle];
    const capacity=Math.min(100,Math.round((s.pallets/v.capacity)*100));
    $('#capacityPercent').textContent=capacity+'%';
    $('#trailerFill').style.width=capacity+'%';
    $('#cargoUnits').textContent=`${s.pallets} / ${v.capacity} units`;
    $('#capacityVehicle').textContent=v.name;
    $('#capacityLoad').textContent=capacity+'%';
    $('#capacityCaption').textContent='Illustrative load estimate';
    $('#routeDistance').textContent=`${s.distance} km · Demo`;
    $('#routeFrom').textContent=s.from;
    $('#routeTo').textContent=s.to;
    $('#activityTimeline').innerHTML=STEP_NAMES.map((label,i)=>`<div class="timeline-item ${i<=s.progress?'completed':''}"><span class="timeline-node"></span><div><strong>${safe(label)}</strong><small>${i<=s.progress?(i===3?'Marked complete in demo':'Simulated milestone'):'Not yet reached'}</small></div></div>`).join('');
    $('#advanceBtn').disabled=s.progress>=3;
    $('#advanceBtn span').textContent=s.progress===3?'Delivery completed (demo)':`Advance: ${STEP_NAMES[s.progress+1]}`;
    $('#photoGrid').innerHTML=PHOTOS.map((photo,i)=>`<button class="photo-thumb" type="button" data-photo="${i}" aria-label="Open sample image ${i+1}"><span class="photo-image"><span class="photo-fallback">Sample image</span><img src="${photo.url}" alt="${safe(photo.label)} reference photograph" loading="lazy"></span><span class="photo-caption">${safe(photo.label)}<small>Sample photo · illustrative</small></span></button>`).join('');
    $('#photoGrid').querySelectorAll('img').forEach((img,i)=>{img.addEventListener('error',()=>{if(img.dataset.fallback)return;img.dataset.fallback='true';img.src=cargoFallback(i);});});
    const use=$('#vehicleLargeArt use');use.setAttribute('href','#'+v.art);
    $('#vehicleInfoGrid').innerHTML=infoRows([['Vehicle class',v.name],['Nominal units',`${v.capacity} pallet units`],['This shipment',`${s.pallets} pallet units`],['Cargo type',s.type],['Route',`${s.distance} km (manual estimate)`],['Status',status(s.progress)]]);
    $('#vehicleProgress').style.width=capacity+'%';
    $('#companyInfoGrid').innerHTML=infoRows([['Workspace','Droply demo'],['Shipment reference',s.id],['Origin',s.from],['Destination',s.to],['Customer account','Not connected'],['Driver contact','Not available in prototype']]);
    $('#billingTotal').textContent=currency(s.price);
    $('#billingInfoGrid').innerHTML=infoRows([['Vehicle class',v.name],['Distance',`${s.distance} km`],['Pallet units',String(s.pallets)],['Payment status','Not charged']]);
    activateTab(tab);
  }
  const infoRows=rows=>rows.map(([k,v])=>`<div class="info-pair"><span>${safe(k)}</span><strong>${safe(v)}</strong></div>`).join('');
  const metric=(label,value,foot)=>`<div class="simple-metric"><span>${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(foot)}</small></div>`;
  function empty(title,copy,ico='box'){return `<div class="blank-view">${icon(ico)}<h3>${safe(title)}</h3><p>${safe(copy)}</p></div>`;}
  function simpleItem(s,action='View'){
    return `<div class="special-item"><div><h4>${safe(s.id)} <span class="mini-status ${statusClass(s.progress)}" style="display:inline-flex;margin-left:7px">${safe(status(s.progress))}</span></h4><p>${safe(s.from)} → ${safe(s.to)}<br>${safe(VEHICLES[s.vehicle].name)} · ${s.pallets} unit(s) · ${safe(currency(s.price))}</p></div><button type="button" class="outline-button" data-select="${safe(s.id)}">${safe(action)}</button></div>`;
  }
  function renderSpecial(){
    const el=$('#specialView');const total=shipments.length,completed=shipments.filter(s=>s.progress===3).length,transit=shipments.filter(s=>s.progress===2).length,waiting=shipments.filter(s=>s.progress<2).length;
    const spend=shipments.reduce((sum,s)=>sum+s.price,0);
    let out='';
    switch(page){
      case 'dashboard':
        out=`<div class="simple-header"><h3>Operations overview</h3><span>DEMO DATA · AUD</span></div><div class="simple-metric-grid">${metric('Total shipments',total,'All local requests')}${metric('On route',transit,'Simulated movements')}${metric('Delivered',completed,'Completed in demo')}</div><div class="content-card"><div class="panel-title-row"><h3>Recent shipments</h3><span class="demo-marker">LOCAL DATA</span></div><div class="special-list">${shipments.slice(0,5).map(s=>simpleItem(s)).join('')||empty('No shipments','Create a request to begin.')}</div></div><div class="content-card"><h3>Estimated spend</h3><div class="billing-total">${currency(spend)}</div><p class="fine-print">Total of illustrative estimates. No real transactions.</p></div>`;break;
      case 'requests':
        out=`<div class="simple-header"><h3>Delivery requests</h3><button type="button" data-open-request class="blue-button">${icon('plus')} New request</button></div><div class="simple-metric-grid">${metric('All requests',total,'Local demo')}${metric('Waiting',waiting,'Unfinished assignment')}${metric('Delivered',completed,'Completed demo')}</div><div class="content-card"><h3>Request history</h3><div class="special-list">${shipments.map(s=>simpleItem(s)).join('')||empty('No requests','Create a sample shipment.')}</div></div>`;break;
      case 'drivers':{
        const available=shipments.filter(s=>s.progress===0);
        out=`<div class="simple-header"><h3>Demo driver board</h3><span>NO REAL DRIVERS</span></div><div class="simple-metric-grid">${metric('Unassigned',available.length,'Available demo jobs')}${metric('Assigned',shipments.filter(s=>s.progress===1).length,'Accepted locally')}${metric('In transit',transit,'Simulated')}</div><div class="content-card"><h3>Available requests</h3><p class="fine-print">Accepting a job changes its demo status only. No driver is notified.</p><div class="special-list">${available.map(s=>`<div class="special-item"><div><h4>${safe(s.id)}</h4><p>${safe(s.from)} → ${safe(s.to)}<br>${safe(VEHICLES[s.vehicle].name)} · ${safe(currency(s.price))} illustrative quote</p></div><button class="blue-button" type="button" data-accept="${safe(s.id)}">Accept demo</button></div>`).join('')||empty('No unassigned jobs','All sample requests are assigned or finished.')}</div></div>`;
        break;
      }
      case 'messages':out=`<div class="simple-header"><h3>Messages</h3><span>COMING LATER</span></div>${empty('No conversations','Driver and customer messaging requires secure accounts and a backend. This prototype does not send messages.','message')}`;break;
      case 'reports':{
        const groups=[['Requested',shipments.filter(s=>s.progress===0).length],['Assigned',shipments.filter(s=>s.progress===1).length],['En route',transit],['Delivered',completed]];
        out=`<div class="simple-header"><h3>Shipment reports</h3><span>DEMO METRICS</span></div><div class="simple-metric-grid">${metric('Shipment count',total,'Local data')}${metric('Completed',completed,'Simulated')}${metric('Est. revenue',currency(spend),'Not collected')}</div><div class="content-card"><h3>Shipment status breakdown</h3>${groups.map(([label,n])=>`<div class="report-block"><div class="estimate-line"><span>${safe(label)}</span><strong>${n}</strong></div><div class="wide-progress"><div style="width:${total?Math.round(n/total*100):0}%"></div></div></div>`).join('')}<p class="fine-print">These figures are generated only from browser-stored demo shipments.</p></div>`;
        break;
      }
      case 'billing':out=`<div class="simple-header"><h3>Estimated charges</h3><span>AUD · NO TRANSACTIONS</span></div><div class="content-card"><div class="eyebrow">TOTAL ILLUSTRATIVE AMOUNT</div><div class="billing-total">${currency(spend)}</div><p class="fine-print">Quotes are not paid, billed, confirmed, or sent anywhere.</p></div><div class="content-card"><h3>Shipment estimates</h3><div class="special-list">${shipments.map(s=>simpleItem(s)).join('')||empty('No estimates','New requests will appear here.')}</div></div>`;break;
      case 'settings':out=`<div class="simple-header"><h3>Workspace settings</h3><span>LOCAL ONLY</span></div><div class="content-card"><h3>About this prototype</h3><div class="settings-row"><span>Workspace</span><strong>Droply Demo</strong></div><div class="settings-row"><span>Version</span><strong>${VERSION}</strong></div><div class="settings-row"><span>Storage</span><strong>Current browser only</strong></div><div class="settings-row"><span>Currency</span><strong>Australian dollar</strong></div><div class="settings-row"><span>Driver / GPS / payments</span><strong>Not connected</strong></div><button class="danger-button" type="button" data-reset>Reset to original sample data</button><p class="fine-print">Reset deletes any demo requests you added on this browser and restores the sample shipments.</p></div>`;break;
    }
    el.innerHTML=out;
  }

  function advance(){const s=selected();if(!s||s.progress===3)return;s.progress++;persist();renderQueue();renderDetail();toast(`Simulated update: ${status(s.progress)}.`);}
  function accept(id){const s=shipments.find(item=>item.id===id);if(!s||s.progress!==0)return;s.progress=1;current=s.id;persist();toast('Demo job accepted. No real driver was contacted.');navigate('tracking');}
  function reset(){if(!confirm('Restore the original sample shipments? Your locally added Droply 3.0 demo requests will be deleted.'))return;shipments=sample();current=shipments[0].id;persist();query='';filter='all';$('#searchInput').value='';renderQueue();navigate('tracking');toast('Sample demo data restored.');}

  function updateQuote(){
    const vehicle=$('#vehicle').value,v=VEHICLES[vehicle];
    const distance=Number($('#distance').value);const pallets=Number($('#pallets').value);
    const valid=Number.isFinite(distance)&&distance>=1&&distance<=2000&&Number.isInteger(pallets)&&pallets>=1&&pallets<=v.capacity;
    $('#formEstimate').textContent=valid?currency(estimate(vehicle,distance,pallets)):'—';
    $('#estimateVehicle').textContent=v.name;
    $('#estimateDistance').textContent=Number.isFinite(distance)?`${distance} km`:'—';
    $('#estimateCapacity').textContent=`${Number.isFinite(pallets)?pallets:'—'} of ${v.capacity} units`;
    const submit=$('#requestForm [type="submit"]');submit.disabled=!valid;
    $('#estimateCapacity').style.color=pallets>v.capacity?'#eda7ac':'';
  }
  function openForm(){const dlg=$('#requestDialog');$('#requestForm').reset();updateQuote();if(!dlg.open)dlg.showModal();setTimeout(()=>$('#pickup').focus(),50);}
  function closeForm(){const dlg=$('#requestDialog');if(dlg.open)dlg.close();}
  function createRequest(event){
    event.preventDefault();const form=$('#requestForm');if(!form.reportValidity())return;
    const vehicle=$('#vehicle').value,v=VEHICLES[vehicle],pallets=Number($('#pallets').value),distance=Number($('#distance').value);
    if(!v||!Number.isInteger(pallets)||pallets<1||pallets>v.capacity||!Number.isFinite(distance)||distance<1||distance>2000){toast('Check the distance and vehicle capacity.');return;}
    const from=$('#pickup').value.trim(),to=$('#dropoff').value.trim();if(!from||!to){toast('Please enter both locations.');return;}
    const s=validate({id:newId(),from,to,distance,pallets,vehicle,type:$('#cargoType').value,progress:0,eta:'TBC',notes:$('#notes').value.trim(),price:estimate(vehicle,distance,pallets),created:now(),sample:false});
    shipments.unshift(s);current=s.id;persist();closeForm();navigate('tracking');renderQueue();toast('Demo request saved to this browser.');
    if(window.innerWidth<=720)$('#detailColumn').scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function copyID(){const id=selected()?.id;if(!id)return;try{await navigator.clipboard.writeText(id);toast(`Copied ${id}`);}catch{toast(`Shipment reference: ${id}`);}}
  function downloadSummary(){
    const s=selected();if(!s)return;
    const lines=['DROPLY — DEMO SHIPMENT SUMMARY','Not a transport document','',`Reference: ${s.id}`,`Origin: ${s.from}`,`Destination: ${s.to}`,`Cargo: ${s.type}`,`Vehicle: ${VEHICLES[s.vehicle].name}`,`Pallet units: ${s.pallets}`,`Estimated distance: ${s.distance} km`,`Indicative cost: ${currency(s.price)}`,`Simulated status: ${status(s.progress)}`,`Date: ${dateText(s.created)}`,'','No booking, transport service or payment was performed.'];
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${s.id}-demo-summary.txt`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Demo summary downloaded.');
  }
  function showPhoto(index){const item=PHOTOS[index];if(!item)return;$('#photoDialogImg').src=item.url;$('#photoDialogCaption').textContent=`${item.label} · Illustrative stock reference, not a real shipment report.`;$('#photoDialog').showModal();}
  function zoom(delta){mapZoom=Math.min(1.8,Math.max(1,mapZoom+delta));$('#mapCanvas').style.transform=`scale(${mapZoom})`;}

  function events(){
    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-go]');if(nav){e.preventDefault();navigate(nav.dataset.go);return;}
      const card=e.target.closest('[data-shipment]');if(card){choose(card.dataset.shipment);return;}
      const filtering=e.target.closest('[data-filter]');if(filtering){filter=filtering.dataset.filter;renderQueue();return;}
      const tabs=e.target.closest('[data-tab]');if(tabs){activateTab(tabs.dataset.tab);return;}
      const open=e.target.closest('[data-open-request]');if(open){openForm();return;}
      const select=e.target.closest('[data-select]');if(select){choose(select.dataset.select);return;}
      const acceptJob=e.target.closest('[data-accept]');if(acceptJob){accept(acceptJob.dataset.accept);return;}
      const photo=e.target.closest('[data-photo]');if(photo){showPhoto(Number(photo.dataset.photo));return;}
      const resetButton=e.target.closest('[data-reset]');if(resetButton){reset();return;}
      const closing=e.target.closest('[data-close-dialog]');if(closing){closeForm();return;}
    });
    $('#searchInput').addEventListener('input',e=>{query=e.target.value;renderQueue();});
    document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus();}});
    ['#sidebarCreate','#quickCreate','#newRequestBtn','#mobileCreate','#mobileNavCreate'].forEach(sel=>$(sel)?.addEventListener('click',openForm));
    $('#requestForm').addEventListener('submit',createRequest);
    ['#vehicle','#distance','#pallets'].forEach(sel=>$(sel).addEventListener('input',updateQuote));
    $('#advanceBtn').addEventListener('click',advance);
    $('#copyIdBtn').addEventListener('click',copyID);
    $('#downloadSummaryBtn').addEventListener('click',downloadSummary);
    $('#zoomInBtn').addEventListener('click',()=>zoom(.2));
    $('#zoomOutBtn').addEventListener('click',()=>zoom(-.2));
    $('#resetMapBtn').addEventListener('click',()=>{mapZoom=1;$('#mapCanvas').style.transform='scale(1)';toast('Illustrative map reset.');});
    $('#closePhotoBtn').addEventListener('click',()=>$('#photoDialog').close());
    $('#requestDialog').addEventListener('click',e=>{if(e.target===$('#requestDialog'))closeForm();});
    $('#photoDialog').addEventListener('click',e=>{if(e.target===$('#photoDialog'))$('#photoDialog').close();});
    $('#photoDialogImg').addEventListener('error',()=>{toast('This sample photo could not load.');$('#photoDialog').close();});
  }

  function init(){load();events();renderQueue();navigate('dashboard');updateQuote();console.info(`Droply ${VERSION}: local demonstration only; no live dispatch or GPS.`);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
