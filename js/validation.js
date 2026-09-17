/* ==========================================================================
   validation.js — shared validation rules + per-form wiring
   Frontend-only demo auth (no backend) as specified in the brief.
   ========================================================================== */

const NAME_RE = /^[A-Za-z\s'-]{2,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[0-9+\-\s()]{7,}$/;

function fieldOf(input){ return input.closest('.form-field'); }

function showFieldError(input, message){
  const field = fieldOf(input);
  if(!field) return false;
  input.setAttribute('aria-invalid', 'true');
  field.classList.add('has-error');
  const err = field.querySelector('.form-error');
  if(err) err.textContent = message;
  return false;
}
function clearFieldError(input){
  const field = fieldOf(input);
  if(field) field.classList.remove('has-error');
  input.setAttribute('aria-invalid', 'false');
  return true;
}

function validateName(input){
  const v = input.value.trim();
  if(!v) return showFieldError(input, 'This field is required.');
  if(!NAME_RE.test(v)) return showFieldError(input, 'Letters only — no numbers or symbols.');
  return clearFieldError(input);
}
function validateEmail(input){
  const v = input.value.trim();
  if(!v) return showFieldError(input, 'Email is required.');
  if(!EMAIL_RE.test(v)) return showFieldError(input, 'Enter a valid email address, like name@example.com.');
  return clearFieldError(input);
}
function validatePhone(input){
  const v = input.value.trim();
  if(!v) return showFieldError(input, 'Phone number is required.');
  if(!PHONE_RE.test(v)) return showFieldError(input, 'Enter a valid phone number.');
  return clearFieldError(input);
}
function validatePassword(input, min = 8){
  const v = input.value;
  if(!v) return showFieldError(input, 'Password is required.');
  if(v.length < min) return showFieldError(input, `Password must contain at least ${min} characters.`);
  return clearFieldError(input);
}
function validateConfirm(input, passwordInput){
  if(!input.value) return showFieldError(input, 'Please confirm your password.');
  if(input.value !== passwordInput.value) return showFieldError(input, 'Passwords do not match.');
  return clearFieldError(input);
}
function validateRequired(input, message = 'This field is required.'){
  if(!input.value || !input.value.trim()) return showFieldError(input, message);
  return clearFieldError(input);
}
function validateCheckbox(input, message = 'Please accept to continue.'){
  const field = fieldOf(input) || input.closest('.checkbox-field');
  if(!input.checked){
    field && field.classList.add('has-error');
    const err = field && field.querySelector('.form-error');
    if(err) err.textContent = message;
    return false;
  }
  field && field.classList.remove('has-error');
  return true;
}

function liveWire(input, validator){
  input.addEventListener('blur', ()=> validator(input));
  input.addEventListener('input', ()=>{ if(fieldOf(input) && fieldOf(input).classList.contains('has-error')) validator(input); });
}

function showToast(message){
  const toast = document.querySelector('.form-toast');
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> toast.classList.remove('is-visible'), 3400);
}

/* ---------- password visibility ---------- */
function initPasswordToggles(){
  document.querySelectorAll('.eye-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.closest('.password-field').querySelector('input');
      const willShow = input.type === 'password';
      input.type = willShow ? 'text' : 'password';
      btn.classList.toggle('is-visible', willShow);
      btn.setAttribute('aria-label', willShow ? 'Hide password' : 'Show password');
      if(typeof gsap !== 'undefined'){
        gsap.fromTo(btn, {scale:.7, rotate:-18}, {scale:1, rotate:0, duration:.4, ease:'back.out(2.2)'});
      }
    });
  });
}

/* ---------- contact form ---------- */
function initContactForm(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  const first = form.querySelector('#first-name');
  const last = form.querySelector('#last-name');
  const email = form.querySelector('#email');
  const phone = form.querySelector('#phone');
  const subject = form.querySelector('#subject');
  const message = form.querySelector('#message');

  liveWire(first, validateName);
  liveWire(last, validateName);
  liveWire(email, validateEmail);
  if(phone) liveWire(phone, validatePhone);
  liveWire(subject, i=>validateRequired(i,'Please add a subject.'));
  liveWire(message, i=>validateRequired(i,'Please add a short message.'));

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const checks = [
      validateName(first), validateName(last), validateEmail(email),
      phone ? validatePhone(phone) : true,
      validateRequired(subject,'Please add a subject.'),
      validateRequired(message,'Please add a short message.')
    ];
    if(checks.every(Boolean)){
      form.reset();
      window.location.href = '404.html';
    } else {
      const firstError = form.querySelector('.has-error input, .has-error textarea');
      if(firstError) firstError.focus();
    }
  });
}

/* ---------- newsletter (blog page) ---------- */
function initNewsletter(){
  const form = document.getElementById('newsletter-form');
  if(!form) return;
  const email = form.querySelector('input[type="email"]');
  if(!email) return;
  const error = form.querySelector('.newsletter-error');

  email.addEventListener('input', ()=>{
    email.removeAttribute('aria-invalid');
    if(error) error.textContent = '';
  });
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const value = email.value.trim();
    const isValid = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value);
    if(!isValid){
      email.setAttribute('aria-invalid', 'true');
      if(error) error.textContent = 'Enter a valid email address, like name@gmail.com.';
      email.focus();
      return;
    }
    email.setAttribute('aria-invalid', 'false');
    form.reset();
    if(error) error.textContent = '';
    window.location.href = '404.html';
  });
}

/* ---------- login ---------- */
function initLoginForm(){
  const form = document.getElementById('login-form');
  if(!form) return;
  const email = form.querySelector('#login-email');
  const password = form.querySelector('#login-password');
  let role = 'public';

  form.querySelectorAll('.role-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      form.querySelectorAll('.role-btn').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      role = btn.dataset.role;
    });
  });

  liveWire(email, validateEmail);
  liveWire(password, i=>validatePassword(i));

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const ok = [validateEmail(email), validatePassword(password)].every(Boolean);
    if(!ok) return;
    showToast('Signing you in…');
    setTimeout(()=>{
      window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'public-dashboard.html';
    }, 550);
  });
}

/* ---------- create account ---------- */
function initCreateAccountForm(){
  const form = document.getElementById('create-account-form');
  if(!form) return;
  const first = form.querySelector('#ca-first-name');
  const last = form.querySelector('#ca-last-name');
  const email = form.querySelector('#ca-email');
  const password = form.querySelector('#ca-password');
  const confirm = form.querySelector('#ca-confirm');
  const terms = form.querySelector('#ca-terms');

  liveWire(first, validateName);
  liveWire(last, validateName);
  liveWire(email, validateEmail);
  liveWire(password, i=>{ const r = validatePassword(i); validateConfirm(confirm, password); return r; });
  liveWire(confirm, i=> validateConfirm(i, password));

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const checks = [
      validateName(first), validateName(last), validateEmail(email),
      validatePassword(password), validateConfirm(confirm, password),
      validateCheckbox(terms, 'Please accept the Terms to continue.')
    ];
    if(checks.every(Boolean)){
      form.style.display = 'none';
      const success = document.getElementById('create-account-success');
      if(success){
        success.classList.add('is-visible');
        if(typeof gsap !== 'undefined') gsap.from(success, {y:20, opacity:0, duration:.6, ease:'power3.out'});
      }
    } else {
      const firstError = form.querySelector('.has-error input');
      if(firstError) firstError.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initPasswordToggles();
  initContactForm();
  initNewsletter();
  initLoginForm();
  initCreateAccountForm();
});
