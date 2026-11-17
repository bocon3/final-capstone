/* ComBaTy FINAL — replaces the old combaty-update.js. Keep it next to index.html and load it
   right before </body> (after the main script):  <script src="combaty-update.js"></script>
   The "Add household" button now opens ONE scrolling form that follows ComBaTy_Survey.docx (Parts I–X). */
(function(){
const $=id=>document.getElementById(id),OT='Other',YN=['Yes','No'];
{const o=$('hh-f');if(o)o.remove()}

// ── Look of the paper-style form ──
const st=document.createElement('style');
st.textContent='.qq{padding:10px 0;border-bottom:1px dashed var(--border)}.ql{font-size:13.5px;line-height:1.45;margin-bottom:6px}.ck{display:flex;gap:8px;align-items:center;padding:3px 0;font-size:14px;cursor:pointer}.ck .in{flex:1;padding:6px 8px}.ph{background:var(--forest);color:#fff;padding:8px 12px;border-radius:8px;margin:18px 0 4px;font:700 13px Inter,sans-serif;letter-spacing:.4px}.wzf{position:sticky;bottom:-22px;background:var(--surface);padding:12px 0 2px;margin-top:14px;border-top:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap;align-items:center}';
document.head.appendChild(st);

// ── Survey content (same wording as the questionnaire) ──
const BR=['Below ₱5,000','₱5,000–₱9,999','₱10,000–₱14,999','₱15,000–₱19,999','₱20,000–₱29,999','₱30,000 or more'],INC=[4000,7500,12500,17500,25000,30000];
const EDMAP={'No formal education':'No schooling','Elementary':'Elementary undergrad/grad','Junior High School':'Secondary undergrad','Senior High School':'Secondary graduate','College':'Tertiary','Vocational/Technical':'Tertiary','Postgraduate':'Tertiary'};
const HMAP={'Concrete':'Good','Semi-concrete':'Fair','Wood':'Poor','Mixed materials':'Fair'};
const SEX=['Male','Female'],ROLE=['Head','Spouse','Son/Daughter','Parent','Other relative','Other'],CIV=['Single','Married','Widowed','Separated','Live-in'],EDU=['None','Elementary','Junior HS','Senior HS','College','Vocational','Postgraduate'];
const Q=(k,n,t,l,o,u)=>({k,n,t,l,o,u});
const FORM=[
['PART III. EDUCATION',[
 Q('q7',7,'r','Are all school-age children in the household currently attending school?',['Yes','No','Not applicable']),
 Q('q8',8,'r','If no, what is the main reason?',['Financial difficulty','Lack of transportation','Lack of school supplies','Child is working','Health-related reason','Lack of interest',OT]),
 Q('q9',9,'r','What is the highest educational attainment of the household head?',['No formal education','Elementary','Junior High School','Senior High School','College','Vocational/Technical','Postgraduate'])]],
['PART IV. EMPLOYMENT AND LIVELIHOOD',[
 Q('q10',10,'n','How many household members are currently employed?',null,'persons'),
 Q('q11',11,'r','What is the main source of livelihood of the household?',['Farming','Fishing','Livestock/Poultry','Small business','Private employment','Government employment','Daily wage/labor','Self-employed','No regular source of income',OT]),
 Q('q12',12,'r','What is the employment status of the household head?',['Regularly employed','Self-employed','Temporarily employed','Seasonal worker','Unemployed','Unable to work']),
 Q('q13',13,'r','If unemployed, what is the main reason?',['Lack of available jobs','Lack of skills','Health condition','Lack of transportation','Family responsibilities',OT])]],
['PART V. HOUSEHOLD INCOME',[
 Q('q14',14,'r','What is the estimated total monthly income of your household from all sources?',BR),
 Q('q15',15,'c','What are the main sources of household income?',['Employment','Farming','Fishing','Small business','Remittances','Government assistance','Pension',OT]),
 Q('q16',16,'r','Does your household experience difficulty meeting its basic needs because of insufficient income?',['Always','Often','Sometimes','Rarely','Never'])]],
['PART VI. BASIC NEEDS AND FOOD SECURITY',[
 Q('q17',17,'r','During the past 30 days, did your household experience a time when there was not enough money or resources to buy food?',YN),
 Q('q18',18,'r','How often does your household experience difficulty providing enough food for all members?',['Never','Rarely','Sometimes','Often','Always']),
 Q('q19',19,'c','Which basic needs are difficult for your household to afford?',['Food','Electricity','Water','Education','Medicine/healthcare','Transportation','Housing',OT])]],
['PART VII. HOUSING AND BASIC SERVICES',[
 Q('q20',20,'r','What is the ownership status of your house?',['Owned','Rented','Rent-free','Living with relatives',OT]),
 Q('q21',21,'r','What is the main source of drinking water?',['Piped water','Deep well','Spring','Water refilling station','River/stream',OT]),
 Q('q22',22,'r','Does your household have access to electricity?',YN),
 Q('q23',23,'r','What type of toilet facility does your household use?',['Water-sealed toilet','Shared toilet','No toilet facility',OT]),
 Q('q24',24,'r','What is the main material of your house?',['Concrete','Semi-concrete','Wood','Mixed materials'])]],
['PART VIII. HEALTH AND SOCIAL ASSISTANCE',[
 Q('q25',25,'r','Does any household member have a serious or long-term health condition?',YN),
 Q('q26',26,'r','Does your household have access to a health facility?',YN),
 Q('q27',27,'r','Has your household received government assistance during the past 12 months?',YN),
 Q('q28',28,'c','If yes, what type of assistance?',['Financial assistance','Food assistance','Educational assistance','Medical assistance','Livelihood assistance',OT])]],
['PART IX. DISASTER AND VULNERABILITY',[
 Q('q29',29,'r','Has your household been affected by a disaster or major environmental event during the past 12 months?',YN),
 Q('q30',30,'r','If yes, what type of event affected your household?',['Flood','Landslide','Typhoon','Drought','Fire',OT]),
 Q('q31',31,'r','Did the event affect your household\'s income or livelihood?',YN)]],
['PART X. HOUSEHOLD POVERTY CONDITIONS',[
 Q('q32',32,'c','Which of the following does your household currently experience?',['Unstable income','Unemployment','Insufficient food','Difficulty paying school expenses','Difficulty paying medical expenses','Inadequate housing','Limited access to clean water','Limited sanitation facilities','Lack of stable livelihood','None of the above']),
 Q('q33',33,'a','What is the biggest challenge currently faced by your household?'),
 Q('q34',34,'c','What kind of assistance would most help your household improve its current situation?',['Employment opportunity','Livelihood assistance','Financial assistance','Educational assistance','Food assistance','Health/medical assistance','Housing assistance','Skills training',OT])]]
];
const ALLQ={consent:{t:'c'}};FORM.forEach(p=>p[1].forEach(q=>ALLQ[q.k]=q));
const W={id:'',code:'',sv:{}};

// ── Form builder ──
function qHTML(q){
 const v=W.sv[q.k];
 let h=`<div class="qq"><div class="ql"><b>${q.n}.</b> ${esc(q.l)}${q.t==='c'?' <i class="sub">(Check all that apply.)</i>':''}</div>`;
 if(q.t==='n')h+=`<input class="in" type="number" min="0" data-k="${q.k}" value="${esc(v)}" style="max-width:140px"> <span class="sub">${q.u||''}</span>`;
 else if(q.t==='a')h+=`<textarea class="in" rows="3" data-k="${q.k}">${esc(v)}</textarea>`;
 else h+=q.o.map(o=>{const on=q.t==='r'?v===o:(v||[]).includes(o);
  return `<label class="ck"><input type="${q.t==='r'?'radio':'checkbox'}" name="${q.k}" value="${esc(o)}" ${on?'checked':''}> ${o===OT?`Other: <input class="in" data-o="${q.k}" value="${esc(W.sv[q.k+'_o'])}">`:esc(o)}</label>`}).join('');
 return h+'</div>';
}
const numQ=(k,n,l,u)=>qHTML(Q(k,n,'n',l,null,u));
function memHTML(mem){
 const n=Math.min(20,Math.max(1,parseInt(W.sv.members)||1)),sel=(c,a,v)=>`<select class="sel" data-c="${c}" style="padding:6px"><option value=""></option>${a.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select>`;
 let r='';for(let i=0;i<n;i++){const x=mem[i]||{};r+=`<tr data-i="${i}"><td>${i+1}.</td><td><input class="in" data-c="age" type="number" min="0" style="width:68px;padding:6px" value="${esc(x.age)}"></td><td>${sel('sex',SEX,x.sex)}</td><td>${sel('role',ROLE,x.role||(i?'':'Head'))}</td><td>${sel('civil',CIV,x.civil)}</td><td>${sel('edu',EDU,x.edu)}</td></tr>`}
 return `<div class="tw"><table><thead><tr><th>Member</th><th>Age</th><th>Sex</th><th>Family Role</th><th>Civil Status</th><th>Highest Educational Attainment</th></tr></thead><tbody>${r}</tbody></table></div>`;
}
function build(){
 const s=W.sv;
 $('wz-c').innerHTML=`<div style="text-align:center"><div class="sub">Institute for Computer Studies</div><h3 style="font-size:19px">SURVEY QUESTIONNAIRE</h3><div class="sub"><i>ComBaTy: Community-based Poverty Mapping with Regression Analysis for the Local Government Unit of Manolo Fortich, Bukidnon</i></div><div class="sub" style="margin-top:4px">${W.id?'Editing':'New'} household · Code <b>${W.code}</b></div></div>
 <div class="ph">DATA PRIVACY STATEMENT</div>
 <div class="note">In compliance with the Data Privacy Act of 2012 (RA 10173), the information collected through this questionnaire will be used solely for academic purposes related to the capstone project “ComBaTy”. All data gathered will be treated with the highest confidentiality, stored securely, and will not be shared with any unauthorized third party. Participation is voluntary, and you may decline to answer any question you are not comfortable with or withdraw at any time without any consequences.</div>
 <label class="ck"><input type="checkbox" name="consent" value="agree" ${(s.consent||[]).length?'checked':''}> I have read and understood the Data Privacy Statement, and I voluntarily agree to participate in this survey.</label>
 <div class="fg" style="margin-top:8px"><div><label class="lab">Signature (type full name)</label><input class="in" data-k="sig" value="${esc(s.sig)}"></div><div><label class="lab">Date</label><input class="in" type="date" data-k="sdate" value="${esc(s.sdate||ts().slice(0,10))}"></div></div>
 <div class="note"><b>Purpose:</b> to collect household information for ComBaTy, a community-based poverty mapping system, used to analyze household poverty conditions, identify poverty patterns and support the prediction of future poverty trends.<br><b>Instructions:</b> please answer each question honestly. Responses are confidential and used only for research purposes.</div>
 <div class="ph">PART I. HOUSEHOLD LOCATION AND BASIC INFORMATION</div>
 <div class="qq"><div class="ql"><b>1.</b> Barangay:</div>${BARANGAYS.map(b=>`<label class="ck"><input type="radio" disabled ${b.name===cur.barangay?'checked':''}> ${esc(b.name)}</label>`).join('')}</div>
 <div class="qq"><div class="ql"><b>2.</b> Sitio/Purok:</div><input class="in" data-k="purok" value="${esc(s.purok)}"></div>
 <div class="qq"><div class="ql"><b>3.</b> Household Code: <b>${W.code}</b> <span class="sub">(auto-assigned; do not write the name here)</span></div></div>
 ${numQ('members',4,'Number of members in the household:','persons')}${numQ('children',5,'Number of children below 18 years old:','children')}${numQ('seniors',6,'Number of senior citizens (60 years old and above):','persons')}
 <div class="qq"><div class="ql"><b>Household head name</b> <span class="sub">(staff records only — not part of the paper form)</span></div><input class="in" data-k="head" value="${esc(s.head)}"></div>
 <div class="ph">PART II. HOUSEHOLD DEMOGRAPHIC INFORMATION</div>
 <div class="sub" style="margin:6px 0">Provide the following information for each household member (rows follow the number of members in Part I).</div><div id="mem-box">${memHTML(s.mem||[])}</div>
 ${FORM.map(p=>`<div class="ph">${p[0]}</div>${p[1].map(qHTML).join('')}`).join('')}
 <div class="wzf"><button class="btn o" onclick="wzCancel()">Cancel</button><button class="btn o" onclick="wzDraft()">💾 Save draft</button><span style="flex:1"></span><button class="btn" onclick="wzSubmit()">✔ Submit survey</button></div>`;
 $('wz').classList.add('on');$('wz-c').scrollTop=0;
}
const wz=document.createElement('div');wz.className='modal';wz.id='wz';wz.innerHTML='<div class="mc" id="wz-c" style="max-width:820px"></div>';document.body.appendChild(wz);
wz.addEventListener('input',e=>{if(e.target.dataset.k==='members'){W.sv.members=e.target.value;W.sv.mem=grabMem();$('mem-box').innerHTML=memHTML(W.sv.mem)}});

// ── Read answers back from the form ──
function grabMem(){return [...wz.querySelectorAll('tr[data-i]')].map(r=>{const g=c=>r.querySelector(`[data-c="${c}"]`).value;return{age:g('age'),sex:g('sex'),role:g('role'),civil:g('civil'),edu:g('edu')}})}
function collect(){
 const s={};
 wz.querySelectorAll('[data-k]').forEach(e=>s[e.dataset.k]=e.value.trim());
 wz.querySelectorAll('[data-o]').forEach(e=>s[e.dataset.o+'_o']=e.value.trim());
 Object.keys(ALLQ).forEach(k=>{if(ALLQ[k].t==='r'||ALLQ[k].t==='c'){const c=[...wz.querySelectorAll(`input[name="${k}"]:checked`)].map(e=>e.value);s[k]=ALLQ[k].t==='r'?(c[0]||''):c}});
 s.mem=grabMem();W.sv=s;return s;
}
function invalid(s,draft){
 if(!draft&&!(s.consent||[]).length)return 'Please tick the Data Privacy consent first.';
 if(!s.head)return 'Enter the household head name.';
 if(!s.purok)return 'Enter the Sitio/Purok (Part I).';
 if(!draft&&!(parseInt(s.members)>0))return 'Enter the number of household members (Part I).';
 return '';
}
function save(status){
 const s=collect(),err=invalid(s,status==='Draft');if(err){toast(err);return}
 const n=Math.max(1,parseInt(s.members)||1),oth=k=>s[k]===OT?(s[k+'_o']||OT):(s[k]||'');
 s.mem=s.mem.slice(0,n);
 const sc=[s.q22==='Yes',['Piped water','Water refilling station'].includes(s.q21),s.q23==='Water-sealed toilet',s.q26==='Yes'].filter(Boolean).length;
 const d={head:s.head,address:s.purok,members:n,income:INC[BR.indexOf(s.q14)]||0,occupation:oth('q11'),education:EDMAP[s.q9]||'No schooling',housing:HMAP[s.q24]||'Fair',services:sc>=3?'Full':sc===2?'Moderate':'Limited',survey:JSON.parse(JSON.stringify(s))};
 let h=W.id&&HOUSEHOLDS.find(x=>x.id===W.id);
 if(h)Object.assign(h,d);else{h={id:W.code,barangay:cur.barangay,lat:null,lng:null,remarks:'',by:cur.username,date:ts().slice(0,10),...d};HOUSEHOLDS.push(h)}
 h.status=status;
 if(status==='Submitted'){h.by=cur.username;h.date=ts().slice(0,10);h.remarks='';NOTIFS.unshift({brgy:cur.barangay,text:`Brgy Staff (${cur.username}) submitted household form ${h.id} (${h.head}) for review.`,time:ts(),read:false})}
 logEvent('Activity',(status==='Submitted'?'Submitted':'Saved draft of')+' household survey '+h.id);
 wz.classList.remove('on');renderForms();toast(status==='Submitted'?'Survey submitted to Barangay.':'Draft saved.','ok');
}
window.openHH=function(id){
 const h=id?HOUSEHOLDS.find(x=>x.id===id):null;
 W.id=id||'';
 W.sv=h?(h.survey?JSON.parse(JSON.stringify(h.survey)):{head:h.head,purok:h.address,members:h.members,consent:['agree']}):{};
 W.code=id||'HH-'+String(Math.max(0,...HOUSEHOLDS.map(x=>parseInt(x.id.slice(3))||0))+1).padStart(4,'0');
 build();
};
window.wzSubmit=()=>save('Submitted');
window.wzDraft=()=>save('Draft');
window.wzCancel=function(){if(confirm('Close the form? Unsaved answers will be lost.'))wz.classList.remove('on')};

// ── View household: also show the full survey answers ──
const _vh=window.viewHH;
window.viewHH=function(id){
 _vh(id);
 const h=HOUSEHOLDS.find(x=>x.id===id),s=h&&h.survey;if(!s)return;
 const ans=q=>{let v=s[q.k];if(Array.isArray(v))v=v.map(x=>x===OT?(s[q.k+'_o']||OT):x).join(', ');else if(v===OT)v=s[q.k+'_o']||OT;return v};
 let x='<h3 style="font-size:14px;margin:4px 0 8px">Survey answers</h3><div style="max-height:38vh;overflow:auto;font-size:12.5px;line-height:1.55;margin-bottom:12px">';
 [['Children below 18',s.children],['Senior citizens',s.seniors]].forEach(([l,v])=>{if(v)x+=`<div style="margin-bottom:6px"><span class="sub">${l}</span><br><b>${esc(v)}</b></div>`});
 FORM.forEach(p=>p[1].forEach(q=>{const v=ans(q);if(v&&v.length)x+=`<div style="margin-bottom:6px"><span class="sub">${q.n}. ${esc(q.l)}</span><br><b>${esc(v)}</b></div>`}));
 if((s.mem||[]).length)x+='<div class="sub">Household members</div>'+s.mem.map((m,i)=>`<div>${i+1}. ${esc([m.age,m.sex,m.role,m.civil,m.edu].filter(Boolean).join(' · '))}</div>`).join('');
 $('mc').querySelector('button').insertAdjacentHTML('beforebegin',x+'</div>');
};

// ── Barangay → Admin report submission ──
window.REPORTS=[];
window.submitReport=function(){
 const hs=myHH().filter(h=>h.status!=='Draft');
 if(!hs.length){toast('There are no submitted forms to report yet.');return}
 if(!confirm('Submit the action taken report for Brgy. '+cur.barangay+' to the Administrator?'))return;
 const n=s=>hs.filter(h=>h.status===s).length,id='RP-'+String(REPORTS.length+1).padStart(3,'0');
 REPORTS.unshift({id,brgy:cur.barangay,by:cur.username,at:ts(),total:hs.length,approved:n('Approved'),review:n('Under Review'),returned:n('Returned'),pending:n('Submitted'),trend:trendSummary(cur.barangay),status:'Submitted',rows:hs.map(h=>({id:h.id,head:h.head,status:h.status,by:h.by,remarks:h.remarks||''}))});
 logEvent('Activity','Submitted report '+id+' to Administrator');renderBR();toast('Report sent to the Administrator.','ok');
};
const _br=window.renderBR;
window.renderBR=function(){
 _br();
 let b=$('sent-box');if(!b){b=document.createElement('div');b.id='sent-box';$('rep-out').before(b)}
 const rs=REPORTS.filter(r=>r.brgy===cur.barangay);
 b.innerHTML=`<div class="box"><div class="bh"><div><h3>Reports sent to Admin</h3><small>Status of reports you submitted</small></div></div><div class="tw"><table><thead><tr><th>Report</th><th>Sent</th><th>Forms</th><th>Status</th></tr></thead><tbody>${rs.map(r=>`<tr><td><b>${r.id}</b></td><td>${r.at}</td><td>${r.total}</td><td><span class="pill ${r.status==='Received'?'vlow':'low'}">${r.status}</span></td></tr>`).join('')||'<tr><td colspan="4" class="sub" style="text-align:center;padding:18px">No reports sent yet.</td></tr>'}</tbody></table></div></div>`;
};
const tb=document.querySelector('#view-brgy-reports .tb'),sb=document.createElement('button');
sb.className='btn live';sb.textContent='📨 Submit report to Admin';sb.onclick=()=>submitReport();tb.appendChild(sb);

NAV['brgy-submissions']=['📥','Barangay Reports','Reports submitted by barangays'];
ROLE_VIEWS.Administrator.splice(4,0,'brgy-submissions');
const av=document.createElement('div');av.className='view';av.id='view-brgy-submissions';
av.innerHTML='<div class="box"><div class="bh"><div><h3>Reports from Barangays</h3><small>Action taken reports submitted by Barangay officials</small></div></div><div class="tw"><table><thead><tr><th>Report</th><th>Barangay</th><th>Submitted by</th><th>Forms</th><th>Status</th><th>Actions</th></tr></thead><tbody id="sub-body"></tbody></table></div></div>';
document.querySelector('main.main').appendChild(av);
window.renderSubs=function(){
 $('sub-body').innerHTML=REPORTS.map(r=>`<tr><td><b>${r.id}</b><div class="sub">${r.at}</div></td><td>${esc(r.brgy)}</td><td>${esc(r.by)}</td><td>${r.total}<div class="sub">${r.approved} approved · ${r.returned} returned</div></td><td><span class="pill ${r.status==='Received'?'vlow':'low'}">${r.status}</span></td><td><button class="ib" onclick="viewReport('${r.id}')" aria-label="View">👁</button>${r.status==='Submitted'?`<button class="ib" onclick="receiveReport('${r.id}')" title="Mark as received" aria-label="Mark received">✔</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="sub" style="text-align:center;padding:22px">No reports submitted yet.</td></tr>';
};
window.viewReport=function(id){
 const r=REPORTS.find(x=>x.id===id);
 $('mc').innerHTML=`<h3>${r.id} · Brgy. ${esc(r.brgy)}</h3><div class="sub">Sent ${r.at} by ${esc(r.by)}</div><p style="font-size:13px;margin:12px 0">Total <b>${r.total}</b> · Approved <b>${r.approved}</b> · Under review <b>${r.review}</b> · Returned <b>${r.returned}</b> · Pending <b>${r.pending}</b></p><p style="font-size:13px;line-height:1.6;margin-bottom:12px">${r.trend||''}</p><div class="tw"><table><thead><tr><th>Household</th><th>Status</th><th>Remarks</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${esc(x.head)} <span class="sub">${x.id}</span></td><td>${x.status}</td><td class="sub">${esc(x.remarks)||'—'}</td></tr>`).join('')}</tbody></table></div><div style="margin-top:14px"><button class="btn" onclick="$('modal').classList.remove('on')">Close</button></div>`;
 $('modal').classList.add('on');
};
window.receiveReport=function(id){
 const r=REPORTS.find(x=>x.id===id);r.status='Received';logEvent('Activity','Received report '+id+' from Brgy. '+r.brgy);renderSubs();buildNav();showView('brgy-submissions');toast('Report marked as received.','ok');
};
const _bn=window.buildNav;
window.buildNav=function(){
 _bn();const b=document.querySelector('#nav [data-v="brgy-submissions"]'),c=REPORTS.filter(r=>r.status==='Submitted').length;
 if(b&&c)b.insertAdjacentHTML('beforeend',`<span class="nb">${c}</span>`);
};
window.showView=function(n){
 if(cur&&cur.role!=='Brgy Staff'&&isPhone()){toast(PHONE_MSG);logout();$('lerr').textContent=PHONE_MSG;$('lerr').classList.add('show');return}
 if(!canView(n)){toast('You do not have access to that page.');return}
 if(n!=='geotag')stopLive(true);
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('act'));$('view-'+n).classList.add('act');
 document.querySelectorAll('.nl,.bn').forEach(b=>b.classList.toggle('act',b.dataset.v===n));
 $('tt').textContent=NAV[n][1];$('ts').textContent=NAV[n][2];
 ({dashboard:renderAdminDash,'system-logs':renderLogs,'ai-analysis':renderAI,'ai-reports':renderAIReports,'brgy-submissions':renderSubs,'poverty-data':renderPD,users:renderUsers,forms:renderForms,geotag:renderGeoList,'brgy-dashboard':renderBD,'brgy-reports':renderBR,notifications:renderNotifs,profile:renderProfile}[n]||(()=>{}))();
 if(innerWidth<=768&&$('sb').classList.contains('on'))toggleSb();
 setTimeout(refreshMaps,60);
};

// ── Login: show/hide password + saved quick-login accounts ──
const lp=$('lp'),w=document.createElement('div');
w.style.position='relative';lp.parentNode.insertBefore(w,lp);w.appendChild(lp);lp.style.paddingRight='46px';
const eye=document.createElement('button');eye.type='button';eye.textContent='👁';eye.setAttribute('aria-label','Show password');
eye.style.cssText='position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;font-size:17px;padding:4px 8px';
eye.onclick=()=>{const s=lp.type==='password';lp.type=s?'text':'password';eye.textContent=s?'🙈':'👁';eye.setAttribute('aria-label',s?'Hide password':'Show password')};
w.appendChild(eye);
const qa=document.createElement('div');qa.style.cssText='margin-top:16px;padding-top:14px;border-top:1px solid var(--border)';
qa.innerHTML='<div class="lab" style="text-align:center">Saved accounts · tap to log in</div>';
ACCOUNTS.slice(0,3).forEach(a=>{const b=document.createElement('button');b.type='button';b.className='btn o';b.style.cssText='width:100%;margin:4px 0;text-align:left';b.innerHTML=`<b>${a.role}</b> <span class="sub">· ${esc(a.username)}</span>`;b.onclick=()=>{$('lu').value=a.username;lp.value=a.password;login()};qa.appendChild(b)});
document.querySelector('#login .lbody').insertBefore(qa,document.querySelector('#login .lbody > p.sub'));
})();