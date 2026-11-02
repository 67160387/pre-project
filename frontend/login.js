document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('loginButton');
  const status = document.getElementById('loginStatus');
  button.disabled = true;
  status.classList.remove('error');
  status.textContent = 'กำลังเข้าสู่ระบบ...';
  try {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const data = await response.json();
    if (!response.ok) throw Error(data.error?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    location.replace('/');
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message;
  } finally { button.disabled = false; }
});
