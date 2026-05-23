// Ganti dengan kredensial Supabase Anda
const SUPABASE_URL = 'https://fettznnppsfxyaogvgbo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rhUpbNaUlgj-p-p28HaGeQ_KoxIIVkV';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let subscription = null;

// Fungsi login
window.login = async function() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (!username) {
        alert('Masukkan username!');
        return;
    }
    
    currentUser = username;
    
    // Tampilkan chat section
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    
    // Load pesan sebelumnya
    loadMessages();
    
    // Subscribe ke realtime updates
    subscribeToMessages();
};

// Load pesan dari database
async function loadMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
    
    if (error) {
        console.error('Error loading messages:', error);
        return;
    }
    
    displayMessages(data);
}

// Display messages
function displayMessages(messages) {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = '';
    
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
    if (!currentUser) return;
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const { error } = await supabase
        .from('messages')
        .insert([
            { username: currentUser, message: message }
        ]);
    
    if (error) {
        console.error('Error sending message:', error);
        alert('Gagal mengirim pesan!');
    } else {
        messageInput.value = '';
    }
};

// Subscribe ke realtime updates
async function subscribeToMessages() {
    if (subscription) {
        subscription.unsubscribe();
    }
    
    subscription = supabase
        .channel('messages-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                // Tambahkan pesan baru ke chat
                const messagesDiv = document.getElementById('chatMessages');
                const newMessage = createMessageElement(payload.new);
                messagesDiv.appendChild(newMessage);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        )
        .subscribe();
}

// Escape HTML untuk mencegah XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Kirim pesan dengan Enter key
document.addEventListener('DOMContentLoaded', () => {
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
