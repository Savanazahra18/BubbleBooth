import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const adminPassword = document.getElementById('adminPassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const adminGrid = document.getElementById('adminGrid');
  const totalPhotos = document.getElementById('totalPhotos');
  const loadingIndicator = document.getElementById('loadingIndicator');

  // DOM Elements for User Management
  const tabUsersBtn = document.getElementById('tabUsersBtn');
  const refreshUsersBtn = document.getElementById('refreshUsersBtn');
  const totalUsers = document.getElementById('totalUsers');
  const loadingUsersIndicator = document.getElementById('loadingUsersIndicator');
  const usersTable = document.getElementById('usersTable');
  const usersTableBody = document.getElementById('usersTableBody');
  const usersContent = document.getElementById('usersContent');
  const filterMsgEmail = document.getElementById('filterMsgEmail');

  // Hardcoded Admin Password (untuk keperluan sederhana)
  const ADMIN_PASSWORD = 'admin'; // Anda dapat menggantinya nanti

  // Cek apakah admin sudah login di session ini (menggunakan sessionStorage agar hilang saat tab ditutup)
  const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
  if (isAdminLoggedIn === 'true') {
    showDashboard();
  }

  // ============================
  // EVENT LISTENERS
  // ============================

  // Login
  loginBtn.addEventListener('click', () => {
    if (adminPassword.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      loginError.style.display = 'none';
      showDashboard();
    } else {
      loginError.style.display = 'block';
    }
  });

  adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  // Navigasi Kembali
  backToHomeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    adminPassword.value = '';
    adminLoginSection.style.display = 'flex';
    adminDashboardSection.style.display = 'none';
  });

  // Refresh
  refreshBtn.addEventListener('click', () => {
    loadAllPhotos();
  });

  // ============================
  // FUNGSI UTAMA DASHBOARD
  // ============================

  let allPhotosData = []; // Menyimpan semua data foto secara lokal untuk mempermudah pencarian/filter
  let allFeedbackData = []; // Menyimpan semua data feedback secara lokal untuk rekap user

  function showDashboard() {
    adminLoginSection.style.display = 'none';
    adminDashboardSection.style.display = 'block';

    // Dengarkan event input pada filter email galeri foto
    const filterInput = document.getElementById('filterUserEmail');
    if (filterInput) {
      filterInput.addEventListener('input', () => {
        applyPhotoFilter();
      });
    }

    // Dengarkan event input pada filter email pesan masuk
    const filterMsgInput = document.getElementById('filterMsgEmail');
    if (filterMsgInput) {
      filterMsgInput.addEventListener('input', () => {
        applyMessageFilter();
      });
    }

    // Tampilkan tab Pengelolaan User secara default
    switchTab(tabUsersBtn, usersContent);
    loadAllUsers();
  }

  async function loadAllUsers() {
    loadingUsersIndicator.style.display = 'block';
    usersTable.style.display = 'none';
    usersTableBody.innerHTML = '';
    totalUsers.textContent = '...';

    // Ambil data foto dari Supabase
    const { data: photoData, error: photoError } = await supabase
      .from('photo_history')
      .select('id, user_email');

    // Ambil data feedback dari Supabase
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('id, user_email');

    loadingUsersIndicator.style.display = 'none';

    if (photoError || feedbackError) {
      console.error('Gagal mengambil data user:', photoError || feedbackError);
      usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data dari database.</td></tr>';
      usersTable.style.display = 'table';
      return;
    }

    allPhotosData = photoData || [];
    allFeedbackData = feedbackData || [];

    // Rekap semua user unik berdasarkan email
    const userStats = {};

    // 1. Rekap dari tabel photo_history
    allPhotosData.forEach(item => {
      const email = item.user_email || 'Publik / Tidak diketahui';
      if (!userStats[email]) {
        userStats[email] = { email, photosCount: 0, feedbackCount: 0 };
      }
      userStats[email].photosCount++;
    });

    // 2. Rekap dari tabel user_feedback
    allFeedbackData.forEach(item => {
      const email = item.user_email || 'guest@example.com';
      if (!userStats[email]) {
        userStats[email] = { email, photosCount: 0, feedbackCount: 0 };
      }
      userStats[email].feedbackCount++;
    });

    const userList = Object.values(userStats);
    totalUsers.textContent = userList.length;

    if (userList.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Belum ada user yang terdaftar.</td></tr>';
      usersTable.style.display = 'table';
      return;
    }

    // Render baris tabel
    userList.forEach((user, index) => {
      const tr = document.createElement('tr');

      // No
      const tdNo = document.createElement('td');
      tdNo.textContent = index + 1;
      tr.appendChild(tdNo);

      // Email
      const tdEmail = document.createElement('td');
      tdEmail.textContent = user.email;
      tdEmail.style.fontWeight = '600';
      tr.appendChild(tdEmail);

      // Jumlah Foto
      const tdPhotos = document.createElement('td');
      tdPhotos.innerHTML = `<span class="count-badge photos">${user.photosCount} Foto</span>`;
      tdPhotos.style.textAlign = 'center';
      tr.appendChild(tdPhotos);

      // Jumlah Feedback
      const tdFeedback = document.createElement('td');
      tdFeedback.innerHTML = `<span class="count-badge feedback">${user.feedbackCount} Pesan</span>`;
      tdFeedback.style.textAlign = 'center';
      tr.appendChild(tdFeedback);

      // Aksi (Tombol Lihat Foto, Lihat Pesan, Hapus User)
      const tdAction = document.createElement('td');
      tdAction.style.textAlign = 'center';

      const actionsWrapper = document.createElement('div');
      actionsWrapper.className = 'table-actions';

      // 1. Tombol Lihat Foto
      const viewPhotosBtn = document.createElement('button');
      viewPhotosBtn.className = 'action-btn';
      viewPhotosBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 1px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        Foto
      `;
      viewPhotosBtn.addEventListener('click', () => {
        switchTab(tabPhotosBtn, photosContent);
        const filterInput = document.getElementById('filterUserEmail');
        if (filterInput) {
          filterInput.value = user.email === 'Publik / Tidak diketahui' ? '' : user.email;
        }
        loadAllPhotos();
      });
      actionsWrapper.appendChild(viewPhotosBtn);

      // 2. Tombol Lihat Pesan
      const viewMsgBtn = document.createElement('button');
      viewMsgBtn.className = 'action-btn secondary';
      viewMsgBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 1px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        Pesan
      `;
      viewMsgBtn.addEventListener('click', () => {
        switchTab(tabMessagesBtn, messagesContent);
        const filterMsgInput = document.getElementById('filterMsgEmail');
        if (filterMsgInput) {
          filterMsgInput.value = user.email === 'Publik / Tidak diketahui' || user.email === 'guest@example.com' ? '' : user.email;
        }
        loadAllMessages();
      });
      actionsWrapper.appendChild(viewMsgBtn);

      // 3. Tombol Hapus User
      const deleteUserBtn = document.createElement('button');
      deleteUserBtn.className = 'action-btn danger';
      deleteUserBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 1px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        Hapus
      `;
      deleteUserBtn.addEventListener('click', () => deleteUser(user.email));
      actionsWrapper.appendChild(deleteUserBtn);

      tdAction.appendChild(actionsWrapper);
      tr.appendChild(tdAction);

      usersTableBody.appendChild(tr);
    });

    usersTable.style.display = 'table';
  }

  async function deleteUser(email) {
    const isSpecialName = email === 'Publik / Tidak diketahui' || email === 'guest@example.com';
    const confirmMessage = isSpecialName
      ? `Apakah Anda yakin ingin menghapus semua data ${email}? Tindakan ini akan menghapus semua foto/pesan terkait yang tidak ber-email.`
      : `Apakah Anda yakin ingin menghapus user "${email}"?\n\nTindakan ini akan menghapus permanen:\n- Semua foto miliknya di database\n- Semua pesan feedback miliknya beserta balasannya\n\nTindakan ini tidak dapat dibatalkan!`;

    if (!confirm(confirmMessage)) return;

    loadingUsersIndicator.style.display = 'block';
    usersTable.style.display = 'none';

    let photoDeleteError = null;
    let feedbackDeleteError = null;

    // 1. Hapus dari tabel photo_history
    if (email === 'Publik / Tidak diketahui') {
      const { error } = await supabase
        .from('photo_history')
        .delete()
        .is('user_email', null);
      photoDeleteError = error;
    } else {
      const { error } = await supabase
        .from('photo_history')
        .delete()
        .eq('user_email', email);
      photoDeleteError = error;
    }

    // 2. Hapus dari tabel user_feedback
    const { error: fError } = await supabase
      .from('user_feedback')
      .delete()
      .eq('user_email', email);
    feedbackDeleteError = fError;

    loadingUsersIndicator.style.display = 'none';

    if (photoDeleteError || feedbackDeleteError) {
      console.error('Gagal menghapus user:', photoDeleteError || feedbackDeleteError);
      alert('Gagal menghapus beberapa data user.');
    } else {
      alert(`User "${email}" beserta seluruh foto dan pesannya berhasil dihapus!`);
    }

    loadAllUsers();
  }

  async function loadAllPhotos() {
    loadingIndicator.style.display = 'block';
    adminGrid.innerHTML = '';
    totalPhotos.textContent = '...';

    // Ambil data dari Supabase
    const { data, error } = await supabase
      .from('photo_history')
      .select('*')
      .order('created_at', { ascending: false });

    loadingIndicator.style.display = 'none';

    if (error) {
      console.error('Gagal mengambil data:', error);
      adminGrid.innerHTML = '<p class="error-msg">Gagal memuat data dari database.</p>';
      return;
    }

    allPhotosData = data || [];
    applyPhotoFilter();
  }

  function applyPhotoFilter() {
    const filterInput = document.getElementById('filterUserEmail');
    const searchQuery = filterInput ? filterInput.value.trim().toLowerCase() : '';

    const filteredData = allPhotosData.filter((item) => {
      if (!searchQuery) return true;
      const email = (item.user_email || 'publik / tidak diketahui').toLowerCase();
      return email.includes(searchQuery);
    });

    renderPhotos(filteredData);
  }

  function renderPhotos(photos) {
    adminGrid.innerHTML = '';
    totalPhotos.textContent = photos.length;

    if (photos.length === 0) {
      adminGrid.innerHTML = '<p style="color: #666; text-align: center; width: 100%;">Tidak ada foto yang cocok.</p>';
      return;
    }

    photos.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'admin-item';

      const img = document.createElement('img');
      img.src = item.image_base64;
      img.alt = 'User Photo';

      const info = document.createElement('div');
      info.className = 'item-info';
      
      // Format tanggal dan user email
      const date = new Date(item.created_at);
      const emailText = item.user_email || 'Publik / Tidak diketahui';
      info.innerHTML = `<strong>User:</strong> ${emailText}<br/><strong>Waktu:</strong> ${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID')}`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'danger-btn delete-item-btn';
      deleteBtn.textContent = 'Hapus Foto';
      deleteBtn.addEventListener('click', () => deletePhoto(item.id));

      div.appendChild(img);
      div.appendChild(info);
      div.appendChild(deleteBtn);

      adminGrid.appendChild(div);
    });
  }

  async function deletePhoto(id) {
    if (!confirm('Yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.')) return;

    const { error } = await supabase
      .from('photo_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Gagal menghapus:', error);
      alert('Gagal menghapus foto.');
    } else {
      loadAllPhotos();
    }
  }

  // Tab Elements
  const tabPhotosBtn = document.getElementById('tabPhotosBtn');
  const tabMessagesBtn = document.getElementById('tabMessagesBtn');
  const photosContent = document.getElementById('photosContent');
  const messagesContent = document.getElementById('messagesContent');
  const refreshMsgBtn = document.getElementById('refreshMsgBtn');
  const totalMessages = document.getElementById('totalMessages');
  const loadingMsgIndicator = document.getElementById('loadingMsgIndicator');
  const messagesList = document.getElementById('messagesList');

  // ============================
  // TABS LOGIC
  // ============================
  function switchTab(activeBtn, activeContent) {
    [tabUsersBtn, tabPhotosBtn, tabMessagesBtn].forEach(btn => btn?.classList.remove('active'));
    [usersContent, photosContent, messagesContent].forEach(content => {
      if (content) content.style.display = 'none';
    });

    activeBtn?.classList.add('active');
    if (activeContent) activeContent.style.display = 'block';
  }

  tabUsersBtn?.addEventListener('click', () => {
    switchTab(tabUsersBtn, usersContent);
    loadAllUsers();
  });

  tabPhotosBtn?.addEventListener('click', () => {
    switchTab(tabPhotosBtn, photosContent);
    loadAllPhotos();
  });

  tabMessagesBtn?.addEventListener('click', () => {
    switchTab(tabMessagesBtn, messagesContent);
    loadAllMessages();
  });

  refreshUsersBtn?.addEventListener('click', () => {
    loadAllUsers();
  });

  refreshMsgBtn?.addEventListener('click', () => {
    loadAllMessages();
  });

  // ============================
  // FUNGSI PESAN MASUK
  // ============================
  async function loadAllMessages() {
    loadingMsgIndicator.style.display = 'block';
    messagesList.innerHTML = '';
    totalMessages.textContent = '...';

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    loadingMsgIndicator.style.display = 'none';

    if (error) {
      console.error('Gagal mengambil pesan:', error);
      messagesList.innerHTML = '<p class="error-msg">Gagal memuat pesan dari database.</p>';
      return;
    }

    allFeedbackData = data || [];
    applyMessageFilter();
  }

  function applyMessageFilter() {
    const filterMsgInput = document.getElementById('filterMsgEmail');
    const searchQuery = filterMsgInput ? filterMsgInput.value.trim().toLowerCase() : '';

    const filteredData = allFeedbackData.filter((item) => {
      if (!searchQuery) return true;
      const email = (item.user_email || 'guest@example.com').toLowerCase();
      return email.includes(searchQuery);
    });

    renderMessages(filteredData);
  }

  function renderMessages(messages) {
    messagesList.innerHTML = '';
    totalMessages.textContent = messages.length;

    if (messages.length === 0) {
      messagesList.innerHTML = '<p style="color: #666; text-align: center; width: 100%;">Tidak ada pesan yang cocok.</p>';
      return;
    }

    messages.forEach((msg) => {
      const card = document.createElement('div');
      card.className = `msg-card ${msg.status === 'replied' ? 'replied' : ''}`;

      const date = new Date(msg.created_at);
      const dateStr = `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID')}`;

      let html = `
        <div class="msg-header">
          <span><strong>Dari:</strong> ${msg.user_email}</span>
          <span>${dateStr}</span>
        </div>
        <div class="msg-content">${msg.message}</div>
      `;

      if (msg.status === 'replied' && msg.admin_reply) {
        html += `<div class="msg-reply-box"><strong>Balasan Anda:</strong><br/>${msg.admin_reply}</div>`;
      } else {
        html += `
          <div class="msg-actions">
            <textarea class="reply-input" id="replyInput-${msg.id}" rows="2" placeholder="Tulis balasan untuk user ini..."></textarea>
            <button class="primary-btn reply-btn" id="replyBtn-${msg.id}">Kirim Balasan</button>
          </div>
        `;
      }

      card.innerHTML = html;
      messagesList.appendChild(card);

      if (msg.status !== 'replied') {
        const rBtn = document.getElementById(`replyBtn-${msg.id}`);
        rBtn?.addEventListener('click', () => sendReply(msg.id));
      }
    });
  }

  async function sendReply(id) {
    const replyInput = document.getElementById(`replyInput-${id}`);
    const replyText = replyInput.value.trim();

    if (!replyText) {
      alert('Balasan tidak boleh kosong!');
      return;
    }

    const { error } = await supabase
      .from('user_feedback')
      .update({ admin_reply: replyText, status: 'replied' })
      .eq('id', id);

    if (error) {
      console.error('Gagal mengirim balasan:', error);
      alert('Gagal mengirim balasan.');
    } else {
      alert('Balasan berhasil dikirim!');
      loadAllMessages();
    }
  }

});
