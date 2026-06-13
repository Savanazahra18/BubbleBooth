import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorMsg = document.getElementById('errorMsg');

      if (!email || !password) {
        errorMsg.textContent = 'Harap isi semua kolom!';
        errorMsg.style.display = 'block';
        return;
      }

      const btn = loginForm.querySelector('.auth-btn');
      btn.textContent = 'Masuk...';
      btn.style.opacity = '0.8';
      btn.style.pointerEvents = 'none';

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        errorMsg.textContent = 'Login gagal: ' + error.message;
        errorMsg.style.display = 'block';
        btn.textContent = 'Masuk';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'all';
      } else {
        errorMsg.style.display = 'none';
        // Supabase Auth stores session inside its own localstorage keys implicitly
        // But we keep this so our Auth Guard in index.html still works
        localStorage.setItem('bubbleBoothUser', email);
        window.location.href = 'index.html';
      }
    });
  }

  // Handle Register
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const errorMsg = document.getElementById('errorMsg');

      if (!email || !password || !confirmPassword) {
        errorMsg.textContent = 'Harap isi semua kolom!';
        errorMsg.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        errorMsg.textContent = 'Konfirmasi Password tidak sesuai!';
        errorMsg.style.display = 'block';
        return;
      }

      const btn = registerForm.querySelector('.auth-btn');
      btn.textContent = 'Mendaftar...';
      btn.style.opacity = '0.8';
      btn.style.pointerEvents = 'none';

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        errorMsg.textContent = 'Gagal Daftar: ' + error.message;
        errorMsg.style.display = 'block';
        btn.textContent = 'Mendaftar';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'all';
      } else {
        errorMsg.style.display = 'none';
        localStorage.setItem('bubbleBoothUser', email);
        window.location.href = 'index.html';
      }
    });
  }
});
