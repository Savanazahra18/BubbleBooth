document.addEventListener('DOMContentLoaded', () => {
  const historyGrid = document.getElementById('historyGrid');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const backBtn = document.getElementById('backBtn');
  const logoEl = document.querySelector('.logo');
  const userEmail = localStorage.getItem('bubbleBoothUser') || 'guest@example.com';

  // ===============================
  // LOAD HISTORY FROM SUPABASE
  // ===============================
  async function loadHistoryFromSupabase() {
    historyGrid.innerHTML = '';

    // Coba load data yang difilter per user_email
    let { data, error } = await supabase
      .from('photo_history')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    // Fallback: Jika gagal karena kolom user_email belum ada di database,
    // muat seluruh data secara publik seperti semula agar web tidak error
    if (error && error.message.includes('user_email')) {
      console.warn('Kolom user_email tidak ditemukan, meload riwayat publik (fallback)...');
      const { data: publicData, error: publicError } = await supabase
        .from('photo_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      data = publicData;
      error = publicError;
    }

    if (error) {
      console.error('Gagal load history dari Supabase:', error);
      historyGrid.innerHTML =
        '<div class="empty-state">Gagal memuat data.</div>';
      clearHistoryBtn.style.display = 'none';
      return;
    }

    if (!data || data.length === 0) {
      historyGrid.innerHTML =
        '<div class="empty-state">Riwayat masih kosong. Ayo ambil foto pertamamu!</div>';
      clearHistoryBtn.style.display = 'none';
      return;
    }

    clearHistoryBtn.style.display = 'inline-block';

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';

      const img = document.createElement('img');
      img.src = item.image_base64;
      img.alt = 'Photobooth History Image';

      div.title = 'Klik untuk mendownload foto ini';
      div.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = item.image_base64;
        a.download = `fish-photobooth-${item.id}.jpg`;
        a.click();
      });

      div.appendChild(img);
      historyGrid.appendChild(div);
    });
  }

  // ===============================
  // NAVIGATION
  // ===============================
  backBtn?.addEventListener('click', () => {
    window.location.href = 'menu.html';
  });

  logoEl?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // ===============================
  // CLEAR HISTORY (SUPABASE)
  // ===============================
  clearHistoryBtn?.addEventListener('click', async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua riwayat photo Anda?')) return;

    // Coba hapus foto yang memiliki user_email milik user aktif
    let { error } = await supabase
      .from('photo_history')
      .delete()
      .eq('user_email', userEmail);

    // Fallback: Jika kolom user_email belum ada, hapus seluruh data (seperti alur lama)
    if (error && error.message.includes('user_email')) {
      console.warn('Kolom user_email tidak ditemukan untuk penghapusan, menghapus semua secara publik (fallback)...');
      const { error: publicError } = await supabase
        .from('photo_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      error = publicError;
    }

    if (error) {
      console.error('Gagal hapus history:', error);
      alert('Gagal menghapus riwayat.');
      return;
    }

    loadHistoryFromSupabase();
  });

  // ===============================
  // USER INFO & MESSAGING
  // ===============================
  
  const contactAdminBtn = document.getElementById('contactAdminBtn');
  const contactModal = document.getElementById('contactModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const contactForm = document.getElementById('contactForm');
  const messageInput = document.getElementById('messageInput');
  const sendMsgBtn = document.getElementById('sendMsgBtn');

  const inboxSection = document.getElementById('inboxSection');
  const inboxList = document.getElementById('inboxList');

  // Contact Admin Modal Logic
  contactAdminBtn?.addEventListener('click', () => {
    contactModal.style.display = 'flex';
  });

  closeModalBtn?.addEventListener('click', () => {
    contactModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === contactModal) {
      contactModal.style.display = 'none';
    }
  });

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (!msg) return;

    sendMsgBtn.textContent = 'Mengirim...';
    sendMsgBtn.disabled = true;

    const { error } = await supabase
      .from('user_feedback')
      .insert([
        { user_email: userEmail, message: msg }
      ]);

    sendMsgBtn.textContent = 'Kirim Pesan';
    sendMsgBtn.disabled = false;

    if (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan.');
    } else {
      alert('Pesan berhasil terkirim ke Admin!');
      messageInput.value = '';
      contactModal.style.display = 'none';
      loadInbox(); // Refresh inbox
    }
  });

  // Load Inbox
  async function loadInbox() {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil kotak masuk:', error);
      return;
    }

    if (!data || data.length === 0) {
      inboxSection.style.display = 'none';
      return;
    }

    inboxSection.style.display = 'block';
    inboxList.innerHTML = '';

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = `inbox-item ${item.status === 'replied' ? 'replied' : ''}`;

      let html = `<div class="inbox-message"><strong>Pesan Anda:</strong> ${item.message}</div>`;
      
      if (item.status === 'replied' && item.admin_reply) {
        html += `<div class="inbox-reply"><strong>Balasan Admin:</strong> ${item.admin_reply}</div>`;
      } else {
        html += `<div class="inbox-status">Menunggu balasan...</div>`;
      }

      div.innerHTML = html;
      inboxList.appendChild(div);
    });
  }

  // ===============================
  // INIT
  // ===============================
  loadHistoryFromSupabase();
  loadInbox();
});