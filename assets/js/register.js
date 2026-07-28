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
    dot.classList.remove('active','done');
    if (i < to)  dot.classList.add('done');
    if (i === to) dot.classList.add('active');
  }
  document.querySelectorAll('.step-line').forEach((ln, idx) => {
    ln.classList.toggle('done', idx < to - 1);
  });
  document.querySelector('.reg-panel').scrollIntoView({behavior:'smooth', block:'start'});
}
async function submitReg(){
  const g = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  const why = g('r_why');
  if (!why) { toast('Missing Field', 'Please tell us why you want to join the Secretariat.'); return; }
  if (!document.getElementById('r_decl').checked) {
    toast('Declaration Required', 'Please confirm the declaration before submitting.'); return;
  }
  const rec = {
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
  const btn = document.getElementById('pledgeBtn');
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Submitting\u2026</span>';
  try {
    rec.created_at = new Date().toISOString();
    const existing = JSON.parse(localStorage.getItem('summit_registrations') || '[]');
    existing.push(rec);
    localStorage.setItem('summit_registrations', JSON.stringify(existing));
    btn.innerHTML = '<span>\u2713  Application Submitted \u2014 We\'ll be in touch!  \u2713</span>';
    btn.style.borderColor = 'var(--gold-bright)';
    toast('Application Received', `Thank you, ${rec.name.split(' ')[0]}! We'll review your application and be in touch.`, 7000);
  } catch (err) {
    console.error('Registration submit error:', err);
    btn.disabled = false;
    btn.innerHTML = originalLabel;
    toast('Submission Failed', "Something went wrong \u2014 please try again.");
  }
}