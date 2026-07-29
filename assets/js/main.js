(function(){
  try {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('vis'));
    } else {
      document.querySelectorAll('.reveal').forEach(el=>{
        new IntersectionObserver((entries,obs)=>{
          entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target)}});
        },{threshold:.08}).observe(el);
      });
    }
  } catch(e) { console.warn('Reveal animation disabled:', e); document.querySelectorAll('.reveal').forEach(el => el.classList.add('vis')); }
  try {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('[data-target]').forEach(el => { el.textContent = el.dataset.target; });
    } else {
      document.querySelectorAll('[data-target]').forEach(el=>{
        new IntersectionObserver((entries,obs)=>{
          entries.forEach(e=>{
            if(!e.isIntersecting)return;
            const t=+e.target.dataset.target;let c=0;
            const s=Math.max(1,Math.ceil(t/50));
            const iv=setInterval(()=>{c=Math.min(c+s,t);e.target.textContent=c;if(c>=t)clearInterval(iv)},38);
            obs.unobserve(e.target);
          });
        },{threshold:.5}).observe(el);
      });
    }
  } catch(e) { console.warn('Counter animation disabled:', e); }
}());
function toast(title,msg,dur){
  dur=dur||4000;
  const el=document.getElementById('toastEl');
  document.getElementById('toastT').textContent=title;
  document.getElementById('toastM').textContent=msg;
  el.style.display='block';el.className='toast in';
  clearTimeout(el._t);
  el._t=setTimeout(()=>{el.className='toast out';setTimeout(()=>{el.style.display='none'},380)},dur);
}
const NPC = {
  overlay: null, box: null, textEl: null, cursor: null,
  choicesEl: null, chatRow: null, chatInput: null, chatSend: null, hint: null, summonBtn: null,
  state: 'CLOSED',
  twTimer: null,
  twPending: null,
  chatHistory: [],
  tutorialDone: false,
  init() {
    this.overlay   = document.getElementById('npcOverlay');
    this.box       = document.getElementById('npcBox');
    this.textEl    = document.getElementById('npcText');
    this.cursor    = document.getElementById('twCursor');
    this.choicesEl = document.getElementById('npcChoices');
    this.chatRow   = document.getElementById('chatRow');
    this.chatInput = document.getElementById('chatInput');
    this.chatSend  = document.getElementById('chatSend');
    this.hint      = document.getElementById('npcHint');
    this.summonBtn = document.getElementById('summonBtn');
  },
  open(fromStart) {
    this.state !== 'CLOSED' && this.hardReset();
    this.state = 'WAITING_CHOICE';
    this.overlay.classList.add('on');
    this.box.classList.add('on');
    this.summonBtn.classList.remove('visible');
    if (fromStart || !this.tutorialDone) {
      this.showStep(0);
    } else {
      this.switchToChat(false);
    }
  },
  close() {
    this.cancelTW();
    this.state = 'CLOSED';
    this.overlay.classList.remove('on');
    this.box.classList.remove('on');
    setTimeout(() => { this.summonBtn.classList.add('visible'); }, 480);
  },
  hardReset() {
    this.cancelTW();
    this.textEl.textContent = '';
    this.cursor.style.display = 'none';
    this.choicesEl.innerHTML = '';
    this.chatRow.classList.remove('on');
  },
  typeWrite(text, onDone) {
    this.cancelTW();
    this.state = 'TYPING';
    this.choicesEl.innerHTML = '';
    this.textEl.textContent = '';
    this.cursor.style.display = 'inline-block';
    this.twPending = onDone || null;
    this.twFullText = text;
    let i = 0;
    const SPEED = 14;
    const tick = () => {
      if (i >= text.length) {
        this.cursor.style.display = 'none';
        this.state = 'WAITING_CHOICE';
        const cb = this.twPending;
        this.twPending = null;
        if (cb) cb();
        return;
      }
      this.textEl.textContent = text.slice(0, ++i);
      const ch = text[i - 1];
      const delay = (ch === ',' || ch === ';') ? SPEED * 2
                  : (ch === '.' || ch === '!' || ch === '?') ? SPEED * 3
                  : SPEED;
      this.twTimer = setTimeout(tick, delay);
    };
    tick();
  },
  skipTW() {
    if (this.state !== 'TYPING') return;
    const cb = this.twPending;
    this.cancelTW();
    if (this.twFullText) this.textEl.textContent = this.twFullText;
    this.cursor.style.display = 'none';
    this.state = 'WAITING_CHOICE';
    if (cb) cb();
  },
  cancelTW() {
    clearTimeout(this.twTimer);
    this.twTimer = null;
    this.twPending = null;
  },
  STEPS: [
    {
      text: "Hey there! I'm Spike, your guide to The Apostles Summit. Welcome! This is a Model United Nations conference — two days, 300 delegates, 100 nations across 7 committees, each paired with one of the Seven Temptations. Let me show you around before you get started.",
      choices: [
        {label:"Tell me about the Summit", next:1},
        {label:"What are the committees?", next:2},
        {label:"How do I register?", next:3},
        {label:"I'm ready — skip the tutorial", next:'chat'}
      ]
    },
    {
      text: "The Apostles Summit is a premier Model United Nations conference in New Delhi. For two days, 300 delegates represent 100 nations across 7 unique committees. You'll debate global issues, craft resolutions, and build consensus — all while developing skills in diplomacy, public speaking, and negotiation.",
      choices: [
        {label:"What are the committees?", next:2},
        {label:"How do I register?", next:3},
        {label:"Ask freely", next:'chat'}
      ]
    },
    {
      text: "Seven chambers await — each paired with a temptation. UNSC embodies Pride, UNHRC represents Greed, UNCSW channels Wrath, AIPPM reflects Envy, IP Press Corps embodies Lust, IPL is Gluttony, and UEFA is Sloth. Every committee offers a distinct flavour of debate and diplomacy.",
      choices: [
        {label:"How do I choose a committee?", next:4},
        {label:"How do I register?", next:3},
        {label:"Ask freely", next:'chat'}
      ]
    },
    {
      text: "Head to the Apply page and fill in your name, school, committee preferences, and more. Once submitted, our team will review your application and contact you about next steps.",
      choices: [
        {label:"What experience level do I need?", next:5},
        {label:"I'm ready — begin!", next:'done'},
        {label:"Ask freely", next:'chat'}
      ]
    },
    {
      text: "Choose the committee that matches your strengths! UNSC demands strategic diplomacy under pressure. UNHRC dives into human rights. UNCSW tackles gender equality. AIPPM simulates Indian parliamentary debate. IP Press Corps is for writers and journalists. IPL and UEFA bring the worlds of cricket and football governance into the MUN arena.",
      choices: [
        {label:"What experience level do I need?", next:5},
        {label:"How do I prepare?", next:6},
        {label:"I'm ready — begin!", next:'done'}
      ]
    },
    {
      text: "All experience levels are welcome! If this is your first MUN, consider UNCSW, IP Press Corps, or AIPPM as your starting committee. Veterans may target the high-stakes UNSC or the niche IPL and UEFA committees. Be honest about your experience — we'll place you where you can shine.",
      choices: [
        {label:"How do I prepare for MUN?", next:6},
        {label:"I'm ready — take me to registration!", next:'done'}
      ]
    },
    {
      text: "Study your assigned nation's foreign policy and read the committee's background guide. Write a position paper with clarity and conviction. Practice speaking aloud. Listen as much as you speak — the best delegates build consensus, not just talk the loudest.",
      choices: [
        {label:"I'm ready to begin!", next:'done'},
        {label:"I have more questions", next:'chat'}
      ]
    }
  ],
  showStep(idx) {
    const step = this.STEPS[idx];
    this.chatRow.classList.remove('on');
    this.choicesEl.style.display = 'flex';
    this.typeWrite(step.text, () => {
      this.renderChoices(step.choices);
    });
  },
  renderChoices(choices) {
    this.choicesEl.innerHTML = choices.map((c, i) => {
      const encoded = encodeURIComponent(JSON.stringify(c));
      return `<button class="npc-choice" onclick="NPC.handleChoice('${encoded}')">${i+1}. ${c.label}</button>`;
    }).join('');
  },
  handleChoice(encoded) {
    const choice = JSON.parse(decodeURIComponent(encoded));
    if (this.state === 'TYPING') { this.skipTW(); return; }
    if      (choice.next === 'chat') { this.switchToChat(true); }
    else if (choice.next === 'done') { this.endTutorial(); }
    else    { this.showStep(choice.next); }
  },
  endTutorial() {
    this.tutorialDone = true;
    this.typeWrite(
      "Awesome! Head over to the Apply page to fill in the Secretariat application. Hit that summon button anytime you need me back. Let's go!",
      () => {
        this.choicesEl.innerHTML =
          `<button class="npc-choice" onclick="NPC.close();window.location.href='apply.html'">★ Take me to the Application Form</button>
           <button class="npc-choice" onclick="NPC.close()">★ I'll explore on my own</button>`;
      }
    );
  },
  switchToChat(greet) {
    this.tutorialDone = true;
    this.choicesEl.style.display = 'none';
    this.chatRow.classList.add('on');
    this.chatHistory = [];
    if (greet) {
      this.typeWrite(
        "Sure thing! Ask me anything about the Summit — committees, how to prep, anything you need.",
        () => { if(this.chatInput) this.chatInput.focus(); }
      );
    } else {
      this.textEl.textContent = "Hey, welcome back! What do you want to know?";
      if(this.chatInput) this.chatInput.focus();
    }
  },
  async sendChat() {
    if (this.state === 'TYPING') { this.skipTW(); return; }
    if (this.state === 'CHAT_LOADING') return;
    const text = this.chatInput.value.trim();
    if (!text) return;
    this.chatInput.value = '';
    this.state = 'CHAT_LOADING';
    this.chatSend.disabled = true;
    this.chatInput.disabled = true;
    this.cursor.style.display = 'inline-block';
    this.textEl.textContent = '';
    try {
      const reply = NPC.getReply(text);
      let full = reply || "Hmm, I didn't quite catch that — try asking again?";
      this.chatHistory.push({ role: 'user', content: text });
      this.chatHistory.push({ role: 'assistant', content: full });
      if (this.chatHistory.length > 16) this.chatHistory = this.chatHistory.slice(-14);
      this.state = 'CHAT_IDLE';
      this.cursor.style.display = 'none';
      this.textEl.textContent = '';
      this.typeWrite(full, () => { if(this.chatInput) this.chatInput.focus(); });
    } catch (err) {
      this.cursor.style.display = 'none';
      this.state = 'CHAT_IDLE';
      const msg = "Oops — something went wrong! Give it a sec and try again.";
      this.typeWrite(msg, () => { if(this.chatInput) this.chatInput.focus(); });
    }
    this.chatSend.disabled = false;
    this.chatInput.disabled = false;
  },
  getReply(msg) {
    const m = msg.toLowerCase();
    if (/committee|chamber|temptation/.test(m) && /choose|pick|select|which/.test(m)) return "Match your strengths! UNSC for high-stakes diplomacy, UNHRC for human rights advocacy, UNCSW for gender equality, AIPPM for parliamentary debate, IP for writing and journalism, IPL for cricket governance, or UEFA for football governance. Each has its own temptation theme!";
    if (/committee|chamber|temptation/.test(m) && /unsc|security council|pride/.test(m)) return "UNSC embodies Pride — the United Nations Security Council. It tackles the most critical global crises with high-stakes diplomacy. A demanding committee for those who thrive under pressure.";
    if (/committee|chamber|temptation/.test(m) && /unhrc|greed|human rights/.test(m)) return "UNHRC embodies Greed — the Human Rights Council. Delegates debate pressing human rights issues from around the globe. Perfect for passionate advocates of justice and equality.";
    if (/committee|chamber|temptation/.test(m) && /uncsw|wrath|gender|women/.test(m)) return "UNCSW embodies Wrath — the Commission on the Status of Women. A fierce focus on gender equality and women's empowerment worldwide. Bring your conviction and drive.";
    if (/committee|chamber|temptation/.test(m) && /aippm|envy|parliament|india/.test(m)) return "AIPPM embodies Envy — the All India Political Parties Meet. Simulate Indian parliamentary debate with cross-party dynamics. Perfect for those passionate about domestic politics.";
    if (/committee|chamber|temptation/.test(m) && /ipl|gluttony|cricket/.test(m)) return "IPL embodies Gluttony — a unique committee themed around cricket governance. Debate the policies, controversies, and future of the Indian Premier League. One of our most distinctive offerings!";
    if (/committee|chamber|temptation/.test(m) && /uefa|sloth|football/.test(m)) return "UEFA embodies Sloth — a special committee themed around European football governance. Discuss policies, controversies, and the future of the beautiful game.";
    if (/committee|chamber|temptation/.test(m) && /ip|press|journalist|lust/.test(m)) return "IP Press Corps embodies Lust — International Press. Our committee for aspiring journalists. Cover the summit, write articles, conduct interviews, and publish daily newsletters!";
    if (/committee|chamber|temptation/.test(m)) return "We have 7 committees, each paired with a temptation: UNSC (Pride), UNHRC (Greed), UNCSW (Wrath), AIPPM (Envy), IP Press Corps (Lust), IPL (Gluttony), and UEFA (Sloth). Head to the Committees page for full details!";
    if (/register|apply|application|how.*join|how.*sign/.test(m)) return "Secretariat applications are open! Head to the Apply page and fill in the form with your name, school, preferences, and more. Our team will review and get back to you!";
    if (/date|when|schedule|timing|october/.test(m)) return "The Apostles Summit takes place on October 15–16, 2026 in New Delhi. Two days of intense diplomacy and debate!";
    if (/venue|location|where|delhi/.test(m)) return "The summit is held in New Delhi, India. The exact venue will be announced to confirmed delegates closer to the date.";
    if (/fee|cost|price|payment|ticket/.test(m)) return "Registration fees and payment details will be shared with shortlisted candidates after the application review. Stay tuned!";
    if (/experience|beginner|first time|newbie|novice/.test(m)) return "All experience levels are welcome! First-timers might prefer UNCSW, IP Press Corps, or AIPPM as their starting committee. Veterans can target UNSC, IPL, or UEFA. Be honest about your experience — we'll place you where you can shine.";
    if (/prepare|prep|research|study|position paper/.test(m)) return "Study your nation's foreign policy, read the committee background guide, and write a position paper. Practice speaking clearly and listen more than you talk. Building consensus wins debates!";
    if (/delegate|delegates|how many/.test(m) && /delegate/.test(m)) return "300 delegates representing 100 nations across 7 committees over 2 days. Each committee has a specific allocation of delegate slots.";
    if (/temptation|sin|theme|seven/.test(m)) return "The Seven Temptations theme pairs each committee with a deadly sin: Pride, Greed, Wrath, Envy, Lust, Gluttony, and Sloth. It reflects the moral complexities delegates navigate when wielding power. A unique twist on the classic MUN format!";
    if (/award|trophy|prize|certificate/.test(m)) return "Outstanding delegates receive recognition awards, certificates, and the honour of being recognised at the closing ceremony!";
    if (/dress|attire|formal/.test(m)) return "Formal western business attire is expected — suits, blazers, ties for gentlemen; blazers, skirts/trousers for ladies. Look sharp, debate sharper!";
    if (/food|lunch|break|meal/.test(m)) return "Meals and refreshments will be provided for all delegates and organisers during the conference days. Dietary preferences can be noted during registration.";
    if (/spike|who.*you|your name/.test(m)) return "I'm Spike! Your friendly guide to The Apostles Summit. I can answer questions about committees, registration, prep tips, and more. Ask away!";
    if (/hello|hi|hey|greetings|sup|yo/.test(m)) return "Hey there! Welcome to The Apostles Summit. What would you like to know?";
    if (/bye|goodbye|see you|thanks|thank/.test(m)) return "Farewell! May your words be sharp and your resolutions pass. Summon me anytime you need guidance!";
    if (/help|what can you|support/.test(m)) return "I can help you with committees, registration, preparation tips, venue details, schedule, and more. Just ask me anything about The Apostles Summit!";
    return "Great question! For details, check the relevant page on our site — or ask me something else. I can help with committees, registration, prep tips, venue, schedule, and more!";
  }
};
function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}
let VAULT_PW = null;
let VAULT_DATA = [];
const VAULT_PASSPHRASE = 'apostles2026';
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()}
function exportCSV(){
  const all=VAULT_DATA;if(!all.length){toast('No Data','No registrations to export yet.');return}
  const h=['#','Name','Email','Phone','Age','School','City','Gender','MUNs Attended','MUNs Organised','Highest Role','Dept 1','Dept 2','Pref Position','Availability','Source','Why Join','Unique Value','Message','Date'];
  const rows=all.map((r,i)=>[i+1,r.name,r.email,r.phone,r.age,r.school,r.city,r.gender,r.muns_attended,r.muns_organised,r.highest_position,r.dept1,r.dept2,r.preferred_position,r.availability,r.source,r.why_join,r.unique_value,r.message,r.created_at].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(','));
  dl(new Blob([[h.join(','),...rows].join('\n')],{type:'text/csv'}),`summit_registrations_${Date.now()}.csv`);
  toast('Exported','CSV file downloaded successfully.',3000);
}
function exportJSON(){
  const all=VAULT_DATA;if(!all.length){toast('No Data','No registrations to export yet.');return}
  dl(new Blob([JSON.stringify(all,null,2)],{type:'application/json'}),`summit_registrations_${Date.now()}.json`);
  toast('Exported','JSON file downloaded successfully.',3000);
}
function clearAll(){
  if(!confirm('This will permanently delete all registration records. Are you sure?'))return;
  localStorage.removeItem('summit_registrations');
  VAULT_DATA = [];
  renderVault2();
  toast('Records Cleared','All registration data has been removed.',4000);
}
function checkPw2() {
  const pw = document.getElementById('adminPw2').value;
  const btn = document.querySelector('#pwSection2 .vbtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Checking\u2026'; }
  setTimeout(() => {
    if (pw !== VAULT_PASSPHRASE) {
      document.getElementById('pwErr2').style.display = 'block';
      document.getElementById('adminPw2').value = '';
      if (btn) { btn.disabled = false; btn.textContent = 'Unlock'; }
      return;
    }
    VAULT_PW = pw;
    VAULT_DATA = JSON.parse(localStorage.getItem('summit_registrations') || '[]');
    document.getElementById('pwSection2').style.display = 'none';
    document.getElementById('vaultContent2').style.display = 'block';
    renderVault2();
    if (btn) { btn.disabled = false; btn.textContent = 'Unlock'; }
  }, 400);
}
function renderVault2() {
  const all = VAULT_DATA;
  const count = document.getElementById('vCount2');
  const body  = document.getElementById('vBody2');
  if (!count || !body) return;
  count.textContent = `${all.length} application${all.length!==1?'s':''} on record`;
  if (!all.length) {
    body.innerHTML = '<tr><td colspan="17"><div class="empty-vault">No applications recorded yet.</div></td></tr>';
    return;
  }
  body.innerHTML = all.map((r,i) => `<tr>
    <td>${i+1}</td>
    <td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone)||'\u2014'}</td>
    <td>${esc(r.age)||'\u2014'}</td><td>${esc(r.school)}</td><td>${esc(r.city)||'\u2014'}</td>
    <td>${esc(r.gender)||'\u2014'}</td><td>${esc(r.munsAttended)||'\u2014'}</td>
    <td>${esc(r.munsOrganised)||'\u2014'}</td><td>${esc(r.highestPosition)||'\u2014'}</td>
    <td>${esc(r.dept1)||'\u2014'}</td><td>${esc(r.dept2)||'\u2014'}</td>
    <td>${esc(r.preferredPosition)||'\u2014'}</td><td>${esc(r.availability)||'\u2014'}</td>
    <td>${esc(r.source)||'\u2014'}</td><td>${new Date(r.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</td>
  </tr>`).join('');
}
function initCounters() {
  try {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('[data-target]').forEach(el => { el.textContent = el.dataset.target; });
      return;
    }
    document.querySelectorAll('[data-target]').forEach(el => {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const t = +e.target.dataset.target; let c = 0;
          const s = Math.max(1, Math.ceil(t/50));
          const iv = setInterval(() => { c = Math.min(c+s, t); e.target.textContent = c; if (c >= t) clearInterval(iv); }, 38);
          obs.unobserve(e.target);
        });
      }, {threshold:.5}).observe(el);
    });
  } catch(e) { console.warn('Counter error:', e); }
}
(function(){
  const CONF_DATE = new Date('2026-10-15T09:00:00');
  const CONF_DATE_LABEL = 'October 15 \u2013 16, 2026';
  const el = {
    days:  document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins:  document.getElementById('cd-mins'),
    secs:  document.getElementById('cd-secs'),
    grid:  document.getElementById('cdGrid'),
    done:  document.getElementById('cdDone'),
    lbl:   document.getElementById('cdDateLabel'),
  };
  if(el.lbl) el.lbl.textContent = 'Conference Date \u00b7 ' + CONF_DATE_LABEL;
  const pad = n => String(n).padStart(2,'0');
  let prevVals = {};
  function tick(){
    const now  = new Date();
    const diff = CONF_DATE - now;
    if(diff <= 0){
      if(el.grid) el.grid.style.display = 'none';
      if(el.done) el.done.style.display = 'block';
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);
    const vals = { days, hours, mins, secs };
    Object.entries(vals).forEach(([k, v]) => {
      const padded = pad(v);
      if(padded !== prevVals[k]) {
        const numEl = el[k];
        if(numEl){
          numEl.classList.add('flip');
          setTimeout(() => {
            numEl.textContent = padded;
            numEl.classList.remove('flip');
          }, 75);
        }
        prevVals[k] = padded;
      }
    });
  }
  tick();
  setInterval(tick, 1000);
})();
function openNPC()  { NPC.open(false); }
function closeNPC() { NPC.close(); }
function sendChat() { NPC.sendChat(); }

function goPage(from, to) {
  if (from === 1) {
    const name  = document.getElementById('r_name').value.trim();
    const email = document.getElementById('r_email').value.trim();
    const phone = document.getElementById('r_phone').value.trim();
    const school= document.getElementById('r_school').value.trim();
    if (!name)  { toast('Missing Field', 'Please enter your full name.'); return; }
    if (!email || !email.includes('@')) { toast('Missing Field', 'Please enter a valid email address.'); return; }
    if (!phone) { toast('Missing Field', 'Please enter your phone number.'); return; }
    if (!school){ toast('Missing Field', 'Please enter your institution.'); return; }
  }
  if (from === 3) {
    const dept1 = document.getElementById('r_dept1').value;
    if (!dept1) { toast('Missing Field', 'Please select at least one department preference.'); return; }
  }
  document.getElementById('page-'+from).classList.remove('active');
  document.getElementById('page-'+to).classList.add('active');
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('step-dot-'+i);
    if (!dot) continue;
    dot.classList.remove('active','done');
    if (i < to)  dot.classList.add('done');
    if (i === to) dot.classList.add('active');
  }
  document.querySelectorAll('.step-line').forEach((ln, idx) => {
    ln.classList.toggle('done', idx < to - 1);
  });
  var rp = document.querySelector('.reg-panel');
  if (rp) rp.scrollIntoView({behavior:'smooth', block:'start'});
}
function submitReg(){
  var g = function(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
  var why = g('r_why');
  if (!why) { toast('Missing Field', 'Please tell us why you want to join the Secretariat.'); return; }
  if (!document.getElementById('r_decl').checked) {
    toast('Declaration Required', 'Please confirm the declaration before submitting.'); return;
  }
  var rec = {
    name: g('r_name'), email: g('r_email'), phone: g('r_phone'),
    age: g('r_age'), school: g('r_school'), city: g('r_city'),
    gender: g('r_gender'), source: g('r_source'),
    munsAttended: g('r_munsatt'), munsOrganised: g('r_munsorg'),
    highestPosition: g('r_highpos'), awards: g('r_awards'),
    otherExperience: g('r_otherexp'),
    dept1: g('r_dept1'), dept2: g('r_dept2'),
    preferredPosition: g('r_prefpos'), availability: g('r_avail'),
    skills: g('r_skills'),
    whyJoin: why, uniqueValue: g('r_value'), message: g('r_msg')
  };
  var btn = document.getElementById('pledgeBtn');
  var originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Submitting\u2026</span>';
  try {
    rec.created_at = new Date().toISOString();
    var existing = JSON.parse(localStorage.getItem('summit_registrations') || '[]');
    existing.push(rec);
    localStorage.setItem('summit_registrations', JSON.stringify(existing));
    btn.innerHTML = '<span>\u2713  Application Submitted \u2014 We\'ll be in touch!  \u2713</span>';
    btn.style.borderColor = 'var(--gold)';
    toast('Application Received', 'Thank you, ' + rec.name.split(' ')[0] + '! We\'ll review your application and be in touch.', 7000);
  } catch (err) {
    console.error('Registration submit error:', err);
    btn.disabled = false;
    btn.innerHTML = originalLabel;
    toast('Submission Failed', 'Something went wrong \u2014 please try again.');
  }
}

function loadPageScript(page) {
  /* register functions now live in main.js — no external load needed */
}

function setPage(page) {
  document.body.dataset.page = page;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLink = document.getElementById('nl-' + page);
  if (navLink) navLink.classList.add('active');
  if (typeof initCounters === 'function') initCounters();
  loadPageScript(page);
}

function navigate(href) {
  if (!href || href === window.location.pathname.split('/').pop()) return;
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.remove('open');
  fetch(href)
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newPage = doc.querySelector('.page');
      const newPageName = doc.body.dataset.page || 'home';
      if (newPage) {
        document.querySelector('.page').replaceWith(newPage);
        setPage(newPageName);
        window.history.pushState({ page: newPageName }, '', href);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    })
    .catch(() => { window.location.href = href; });
}

function initPage() {
  const page = document.body.dataset.page || 'home';
  setPage(page);
  NPC.init();
  const hint = document.getElementById('npcHint');
  const textWrap = document.getElementById('npcTextWrap');
  const chatInput = document.getElementById('chatInput');
  const summonBtn = document.getElementById('summonBtn');
  if (hint) hint.addEventListener('click', () => NPC.onHintClick());
  if (textWrap) textWrap.addEventListener('click', () => NPC.onHintClick());
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); NPC.sendChat(); }
    });
  }
  if (summonBtn) {
    summonBtn.addEventListener('mouseenter', () => { /* no-op */ });
    summonBtn.addEventListener('mouseleave', () => { /* no-op */ });
  }
  if (NPC.summonBtn) NPC.summonBtn.classList.add('visible');
  try { if (page === 'home') setTimeout(() => NPC.open(true), 900); } catch(e) { console.error('Spike launch error:', e); }
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.hostname === window.location.hostname && !link.hasAttribute('download') && !link.hasAttribute('target')) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('data:') && href.endsWith('.html')) {
        e.preventDefault();
        navigate(href);
        return;
      }
    }
    const nav = document.getElementById('navLinks');
    const toggle = document.getElementById('navToggle');
    if (nav && toggle && nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('open');
    }
  });
  window.addEventListener('popstate', (e) => {
    const page = (e.state && e.state.page) || 'home';
    const href = page === 'home' ? 'index.html' : page + '.html';
    fetch(href)
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newPage = doc.querySelector('.page');
        if (newPage) {
          document.querySelector('.page').replaceWith(newPage);
          setPage(page);
        }
      });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
