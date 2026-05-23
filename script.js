// Ganti dengan kredensial Supabase Anda
const SUPABASE_URL = 'https://fettznnppsfxyaogvgbo.supabase.co';  // Sesuaikan dengan URL Anda
const SUPABASE_ANON_KEY = 'sb_publishable_rhUpbNaUlgj-p-p28HaGeQ_KoxIIVkV';  // Ganti dengan key asli

// Inisialisasi Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let subscription = null;

// Fungsi login
window.login = async function() {
    console.log('Login function called'); // Untuk debugging
    
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    console.log('Username:', username);
    
    if (!username) {
        alert('Masukkan username!');
        return;
    }
    
    currentUser = username;
    
    // Sembunyikan form login, tampilkan chat
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    
    // Load pesan sebelumnya
    await loadMessages();
    
    // Subscribe ke realtime
    subscribeToMessages();
    
    console.log('Login successful for:', username);
};

// Load pesan dari database
async function loadMessages() {
    console.log('Loading messages...');
    
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
    
    if (error) {
        console.error('Error loading messages:', error);
        alert('Gagal memuat pesan: ' + error.message);
        return;
    }
    
    console.log('Messages loaded:', data);
    displayMessages(data);
}

// Display messages
function displayMessages(messages) {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        messagesDiv.innerHTML = '<div style="text-align:center;color:#a0aec0;">Belum ada pesan. Jadi yang pertama! 💬</div>';
        return;
    }
    
    messages.forEach(msg => {
        const messageElement = createMessageElement(msg);
        messagesDiv.appendChild(messageElement);
    });
    
    // Scroll ke bawah
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Create message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(message.created_at).toLocaleTimeString('id-ID');
    
    messageDiv.innerHTML = `
        <span class="message-username">${escapeHtml(message.username)}:</span>
        <span class="message-text">${escapeHtml(message.message)}</span>
        <span class="message-time">${time}</span>
    `;
    
    return messageDiv;
}

// Kirim pesan
window.sendMessage = async function() {
    if (!currentUser) {
        console.log('No user logged in');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    console.log('Sending message:', message);
    
    const { data, error } = await supabase
        .from('messages')
        .insert([
            { username: currentUser, message: message }
        ])
        .select();
    
    if (error) {
        console.error('Error sending message:', error);
        alert('Gagal mengirim pesan: ' + error.message);
    } else {
        console.log('Message sent successfully:', data);
        messageInput.value = '';
    }
};

// Subscribe ke realtime updates
function subscribeToMessages() {
    if (subscription) {
        subscription.unsubscribe();
    }
    
    console.log('Subscribing to realtime updates...');
    
    subscription = supabase
        .channel('messages-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                console.log('New message received:', payload.new);
                // Tambahkan pesan baru ke chat
                const messagesDiv = document.getElementById('chatMessages');
                
                // Hapus placeholder jika ada
                if (messagesDiv.children.length === 1 && messagesDiv.children[0].innerText.includes('Belum ada pesan')) {
                    messagesDiv.innerHTML = '';
                }
                
                const newMessage = createMessageElement(payload.new);
                messagesDiv.appendChild(newMessage);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        )
        .subscribe((status) => {
            console.log('Subscription status:', status);
        });
}

// Escape HTML untuk mencegah XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listener untuk Enter key
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, script initialized');
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});
