// app.js - Perbaikan dengan menambahkan setupAuth()
// Supabase Configuration
const SUPABASE_URL = 'https://bxhrnnwfqlsoviysqcdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aHJubndmcWxzb3ZpeXNxY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODkzNDIsImV4cCI6MjA4MTM2NTM0Mn0.O7fpv0TrDd-8ZE3Z9B5zWyAuWROPis5GRnKMxmqncX8';

// Initialize Supabase Client
const supabaseclient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Management
let currentUser = null;
let currentAI = null;
let conversationHistory = [];
let customAIs = [];
let aiAvatarFile = null;
let aiBackgroundFile = null;
let currentAIOwner = null;
let currentPage = 'home';
let aiToDelete = null;

// DOM Elements
const authModal = document.getElementById('authModal');
const appContainer = document.getElementById('appContainer');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authConfirmPassword = document.getElementById('authConfirmPassword');
const authSubmit = document.getElementById('authSubmit');
const authSwitchText = document.getElementById('authSwitchText');
const authSwitchLink = document.getElementById('authSwitchLink');
const userAvatar = document.getElementById('userAvatar');
const avatarInitial = document.getElementById('avatarInitial');
const dropdownMenu = document.getElementById('dropdownMenu');
const userNameItem = document.getElementById('userNameItem');
const aiGrid = document.getElementById('aiGrid');
const pageTitle = document.getElementById('pageTitle');
const createModal = document.getElementById('createModal');
const chatContainer = document.getElementById('chatContainer');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const chatAiName = document.getElementById('chatAiName');
const chatAiCreator = document.getElementById('chatAiCreator');
const chatAiAvatar = document.getElementById('chatAiAvatar');
const chatAiAvatarText = document.getElementById('chatAiAvatarText');
const commentsModal = document.getElementById('commentsModal');
const commentsTitle = document.getElementById('commentsTitle');
const commentsBody = document.getElementById('commentsBody');
const commentInput = document.getElementById('commentInput');
const commentsList = document.getElementById('commentsList');
const settingsModal = document.getElementById('settingsModal');
const settingsUsername = document.getElementById('settingsUsername');
const deleteModal = document.getElementById('deleteModal');

// Auth State
let isLoginMode = true;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    const session = await supabaseclient.auth.getSession();
    if (session.data.session) {
        currentUser = session.data.session.user;
        await loadUserData();
        showApp();
    } else {
        setupAuth();
    }
    
    setupEventListeners();
});

// Fungsi setupAuth yang hilang
function setupAuth() {
    // Set up auth event listeners
    authSwitchLink.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', handleAuthSubmit);
    
    // Show auth modal
    authModal.classList.add('active');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // User menu
    userAvatar.addEventListener('click', toggleDropdown);
    document.getElementById('settingsMenuItem').addEventListener('click', openSettings);
    document.getElementById('logoutMenuItem').addEventListener('click', logout);
    
    // Create AI modal
    document.getElementById('cancelCreateBtn').addEventListener('click', closeModal);
    document.getElementById('createAIBtn').addEventListener('click', createAI);
    
    // File uploads
    document.getElementById('avatarUpload').addEventListener('click', () => {
        document.getElementById('aiAvatarInput').click();
    });
    document.getElementById('bgUpload').addEventListener('click', () => {
        document.getElementById('aiBgInput').click();
    });
    document.getElementById('aiAvatarInput').addEventListener('change', previewAvatar);
    document.getElementById('aiBgInput').addEventListener('change', previewBackground);
    
    // Chat
    document.getElementById('backButton').addEventListener('click', closeChat);
    document.getElementById('openCommentsBtn').addEventListener('click', openComments);
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', handleChatKeyPress);
    
    // Comments
    document.getElementById('closeCommentsBtn').addEventListener('click', closeComments);
    document.getElementById('submitCommentBtn').addEventListener('click', submitComment);
    
    // Settings
    document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Delete AI modal
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        deleteModal.classList.remove('active');
        aiToDelete = null;
    });
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteAI);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-avatar') && !e.target.closest('.dropdown-menu')) {
            dropdownMenu.classList.remove('active');
        }
    });
}

// Auth Functions
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        authTitle.textContent = 'Masuk ke Oradevai';
        authSubtitle.textContent = 'Akses platform AI terbaik Indonesia';
        authSubmit.textContent = 'Masuk';
        authSwitchText.textContent = 'Belum punya akun?';
        authSwitchLink.textContent = 'Daftar';
        authConfirmPassword.style.display = 'none';
    } else {
        authTitle.textContent = 'Daftar Akun Baru';
        authSubtitle.textContent = 'Bergabung dengan platform AI terbaik';
        authSubmit.textContent = 'Daftar';
        authSwitchText.textContent = 'Sudah punya akun?';
        authSwitchLink.textContent = 'Masuk';
        authConfirmPassword.style.display = 'block';
    }
    
    authUsername.value = '';
    authPassword.value = '';
    authConfirmPassword.value = '';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    const confirmPassword = authConfirmPassword.value.trim();
    
    if (!username || !password) {
        alert('Username dan password harus diisi');
        return;
    }
    
    if (!isLoginMode && password !== confirmPassword) {
        alert('Password dan konfirmasi password tidak cocok');
        return;
    }
    
    authSubmit.disabled = true;
    authSubmit.textContent = 'Memproses...';
    
    try {
        if (isLoginMode) {
            // Login
            const { data, error } = await supabaseclient.auth.signInWithPassword({
                email: `${username}@oradevai.com`,
                password: password
            });
            
            if (error) throw error;
            
            currentUser = data.user;
            await loadUserData();
            showApp();
        } else {
            // Register
            const { data, error } = await supabaseclient.auth.signUp({
                email: `${username}@oradevai.com`,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });
            
            if (error) throw error;
            
            // Create user profile
            const { error: profileError } = await supabaseclient
                .from('users_oradevai')
                .insert([{
                    id: data.user.id,
                    username: username,
                    created_at: new Date().toISOString()
                }]);
            
            if (profileError) {
                console.error('Profile error:', profileError);
                // Continue anyway
            }
            
            currentUser = data.user;
            await loadUserData();
            showApp();
        }
    } catch (error) {
        console.error('Auth error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent = isLoginMode ? 'Masuk' : 'Daftar';
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    // Load user profile
    const { data: profile } = await supabaseclient
        .from('users_oradevai')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (profile) {
        currentUser.username = profile.username;
        currentUser.avatar_url = profile.avatar_url;
    }
    
    // Update UI
    updateUserUI();
    
    // Load AIs
    await loadAIs();
}

function updateUserUI() {
    avatarInitial.textContent = currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U';
    userNameItem.textContent = currentUser.username || 'User';
    
    // Update avatar if exists
    if (currentUser.avatar_url) {
        userAvatar.style.backgroundImage = `url(${currentUser.avatar_url})`;
        userAvatar.style.backgroundSize = 'cover';
        avatarInitial.style.display = 'none';
    }
}

function showApp() {
    authModal.classList.remove('active');
    appContainer.classList.add('active');
}

// Navigation Functions
function handleNavigation(e) {
    const page = e.target.dataset.page;
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
    
    currentPage = page;
    
    // Update page title
    if (page === 'home') {
        pageTitle.textContent = 'AI Assistant';
    } else if (page === 'my-ai') {
        pageTitle.textContent = 'AI Saya';
    }
    
    // Reload AIs with appropriate filter
    loadAIs();
}

// User Menu Functions
function toggleDropdown() {
    dropdownMenu.classList.toggle('active');
}

function openSettings() {
    dropdownMenu.classList.remove('active');
    settingsUsername.value = currentUser.username || '';
    settingsModal.classList.add('active');
}

function closeSettings() {
    settingsModal.classList.remove('active');
}

async function saveSettings() {
    const newUsername = settingsUsername.value.trim();
    const newPassword = document.getElementById('settingsPassword').value;
    const confirmPassword = document.getElementById('settingsConfirmPassword').value;
    
    try {
        // Update username if changed
        if (newUsername && newUsername !== currentUser.username) {
            const { error } = await supabaseclient
                .from('users_oradevai')
                .update({ username: newUsername })
                .eq('id', currentUser.id);
            
            if (error) throw error;
            
            currentUser.username = newUsername;
            updateUserUI();
        }
        
        // Update password if provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                alert('Password dan konfirmasi tidak cocok');
                return;
            }
            
            const { error } = await supabaseclient.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
        }
        
        alert('Pengaturan berhasil disimpan');
        closeSettings();
    } catch (error) {
        console.error('Settings error:', error);
        alert(`Error: ${error.message}`);
    }
}

async function logout() {
    await supabaseclient.auth.signOut();
    location.reload();
}

// AI Management Functions
async function loadAIs() {
    try {
        let query = supabaseclient
            .from('ais_oradevai')
            .select('*');
        
        if (currentPage === 'my-ai') {
            // Only show user's AIs
            query = query.eq('creator_id', currentUser.id);
        } else {
            // Show public AIs and user's own AIs
            query = query.or(
  `creator_id.eq.${currentUser.id},is_public.eq.true`
);
        }
        
        const { data: userAIs, error } = await query;
        
        if (error) throw error;
        
        // Load default AI for home page
        if (currentPage === 'home') {
            const defaultAI = {
                id: 'oradevai',
                name: 'ORADEVAI V1.0',
                personality: 'Formal, Informatif, Akurat',
                background: 'AI utama yang dibuat oleh ORADEV (Almajid), programmer Indonesia. TikTok: @orasampurna, Instagram: @al_majid.16',
                thoughts: 'Siap membantu dengan berbagai pertanyaan. Mengingat semua percakapan.',
                behavior: 'Jawab pertanyaan secara bertahap. Jangan berikan semua informasi sekaligus. Jangan katakan "Saya adalah model bahasa besar".',
                is_public: true,
                creator_id: 'system',
                avatar_url: null,
                background_url: null,
                created_at: new Date().toISOString(),
                likes: 0,
                dislikes: 0,
                is_disabled: false
            };
            
            customAIs = [defaultAI, ...(userAIs || [])];
        } else {
            customAIs = userAIs || [];
        }
        
        // Filter out disabled AIs for home page
        if (currentPage === 'home') {
            customAIs = customAIs.filter(ai => !ai.is_disabled);
        }
        
        // Load ratings
        await loadAIRatings();
        
        renderAIList();
    } catch (error) {
        console.error('Load AIs error:', error);
        customAIs = [];
        renderAIList();
    }
}

async function loadAIRatings() {
    try {
        for (const ai of customAIs) {
            const { data: ratings } = await supabaseclient
                .from('ratings_oradevai')
                .select('type')
                .eq('ai_id', ai.id);
            
            if (ratings) {
                ai.likes = ratings.filter(r => r.type === 'like').length;
                ai.dislikes = ratings.filter(r => r.type === 'dislike').length;
                
                // Check if current user has rated
                const userRating = ratings.find(r => r.user_id === currentUser.id);
                ai.user_rating = userRating ? userRating.type : null;
            }
        }
    } catch (error) {
        console.error('Load ratings error:', error);
    }
}

function renderAIList() {
    aiGrid.innerHTML = '';
    
    // Sort AIs by rating (likes - dislikes) for home page
    let sortedAIs = [...customAIs];
    if (currentPage === 'home') {
        sortedAIs.sort((a, b) => {
            const scoreA = (a.likes || 0) - (a.dislikes || 0);
            const scoreB = (b.likes || 0) - (b.dislikes || 0);
            return scoreB - scoreA;
        });
    }
    
    sortedAIs.forEach(ai => {
        createAICard(ai);
    });
    
    // Add "Create New AI" card for my-ai page
    if (currentPage === 'my-ai') {
        const addCard = document.createElement('div');
        addCard.className = 'ai-card add-ai-card';
        addCard.innerHTML = `
            <div class="add-button">
                <div class="plus-icon">+</div>
                <div>Buat AI Baru</div>
            </div>
        `;
        addCard.addEventListener('click', openCreateModal);
        aiGrid.appendChild(addCard);
    }
}

function createAICard(ai) {
    const card = document.createElement('div');
    card.className = 'ai-card';
    
    const isCreator = ai.creator_id === currentUser.id;
    const isSystem = ai.creator_id === 'system';
    const isPublic = ai.is_public;
    const isDisabled = ai.is_disabled;
    
    card.innerHTML = `
        <div class="ai-card-header">
            <div class="ai-name">${ai.name} ${isDisabled ? '(Nonaktif)' : ''}</div>
            <div class="ai-status ${isPublic && !isDisabled ? '' : 'offline'}"></div>
        </div>
        <div class="ai-traits">${ai.personality}</div>
        <div class="ai-thought-container">
            <div class="italic-thought">${ai.thoughts}</div>
        </div>
        <div class="ai-creator">
            <div class="creator-avatar">${isSystem ? 'S' : (ai.creator_name ? ai.creator_name.charAt(0) : 'U')}</div>
            <div>${isSystem ? 'System' : (ai.creator_name || 'User')}</div>
            ${!isPublic ? '<div style="margin-left: auto; font-size: 10px; color: #ff4444;">Private</div>' : ''}
            ${isDisabled ? '<div style="margin-left: auto; font-size: 10px; color: #ffaa00;">Nonaktif</div>' : ''}
        </div>
        <div class="ai-rating">
            <button class="like-button ${ai.user_rating === 'like' ? 'active' : ''}">
                👍 ${ai.likes || 0}
            </button>
            <button class="dislike-button ${ai.user_rating === 'dislike' ? 'active' : ''}">
                👎 ${ai.dislikes || 0}
            </button>
        </div>
    `;
    
    // Add action buttons for creator
    if (isCreator && !isSystem) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'ai-actions';
        actionsDiv.innerHTML = `
            <button class="ai-action-btn delete" title="Hapus/Nonaktifkan">🗑️</button>
        `;
        card.appendChild(actionsDiv);
        
        // Add delete button event
        actionsDiv.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteModal(ai);
        });
    }
    
    // Set background if exists
    if (ai.background_url) {
        card.style.background = `linear-gradient(rgba(17, 17, 17, 0.9), rgba(17, 17, 17, 0.9)), url(${ai.background_url})`;
        card.style.backgroundSize = 'cover';
    }
    
    // Add rating event listeners
    const likeBtn = card.querySelector('.like-button');
    const dislikeBtn = card.querySelector('.dislike-button');
    
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rateAI(ai.id, 'like');
    });
    
    dislikeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rateAI(ai.id, 'dislike');
    });
    
    // Only allow chat if AI is not disabled
    if (!isDisabled) {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.ai-actions') && 
                !e.target.classList.contains('like-button') && 
                !e.target.classList.contains('dislike-button')) {
                openChat(ai);
            }
        });
    } else {
        card.style.opacity = '0.7';
        card.style.cursor = 'not-allowed';
    }
    
    aiGrid.appendChild(card);
}

function showDeleteModal(ai) {
    aiToDelete = ai;
    deleteModal.classList.add('active');
}

async function confirmDeleteAI() {
    if (!aiToDelete) return;
    
    const action = document.getElementById('deleteAction').value;
    
    try {
        if (action === 'disable') {
            // Disable AI
            const { error } = await supabaseclient
                .from('ais_oradevai')
                .update({ is_disabled: true })
                .eq('id', aiToDelete.id);
            
            if (error) throw error;
            
            alert('AI berhasil dinonaktifkan');
        } else {
            // Delete permanently
            // First, delete related data
            await supabaseclient
                .from('ratings_oradevai')
                .delete()
                .eq('ai_id', aiToDelete.id);
            
            await supabaseclient
                .from('comments_oradevai')
                .delete()
                .eq('ai_id', aiToDelete.id);
            
            await supabaseclient
                .from('messages_oradevai')
                .delete()
                .eq('ai_id', aiToDelete.id);
            
            // Then delete the AI
            const { error } = await supabaseclient
                .from('ais_oradevai')
                .delete()
                .eq('id', aiToDelete.id);
            
            if (error) throw error;
            
            alert('AI berhasil dihapus permanen');
        }
        
        deleteModal.classList.remove('active');
        aiToDelete = null;
        
        // Reload AIs
        await loadAIs();
    } catch (error) {
        console.error('Delete AI error:', error);
        alert(`Error: ${error.message}`);
    }
}

async function rateAI(aiId, type) {
    try {
        // Check if user already rated
        const { data: existingRating } = await supabaseclient
            .from('ratings_oradevai')
            .select('id, type')
            .eq('ai_id', aiId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (existingRating) {
            if (existingRating.type === type) {
                // Remove rating
                await supabaseclient
                    .from('ratings_oradevai')
                    .delete()
                    .eq('id', existingRating.id);
            } else {
                // Update rating
                await supabaseclient
                    .from('ratings_oradevai')
                    .update({ type: type })
                    .eq('id', existingRating.id);
            }
        } else {
            // Create new rating
            await supabaseclient
                .from('ratings_oradevai')
                .insert([{
                    ai_id: aiId,
                    user_id: currentUser.id,
                    type: type,
                    created_at: new Date().toISOString()
                }]);
        }
        
        // Reload AIs to update ratings
        await loadAIs();
    } catch (error) {
        console.error('Rate AI error:', error);
    }
}

// File Upload Functions
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        aiAvatarFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('avatarPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function previewBackground(event) {
    const file = event.target.files[0];
    if (file) {
        aiBackgroundFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('bgPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function uploadFile(file, path) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;
        
        const { error: uploadError } = await supabaseclient.storage
            .from('ai-assets')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabaseclient.storage
            .from('ai-assets')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// AI Creation
function openCreateModal() {
    createModal.classList.add('active');
}

function closeModal() {
    createModal.classList.remove('active');
    // Reset form
    document.getElementById('aiName').value = '';
    document.getElementById('aiPersonality').value = '';
    document.getElementById('aiBackground').value = '';
    document.getElementById('aiThoughts').value = '';
    document.getElementById('aiBehavior').value = '';
    document.getElementById('aiPublic').value = 'true';
    document.getElementById('avatarPreview').style.display = 'none';
    document.getElementById('bgPreview').style.display = 'none';
    aiAvatarFile = null;
    aiBackgroundFile = null;
}

async function createAI() {
    const name = document.getElementById('aiName').value.trim();
    const personality = document.getElementById('aiPersonality').value.trim();
    const background = document.getElementById('aiBackground').value.trim();
    const thoughts = document.getElementById('aiThoughts').value.trim();
    const behavior = document.getElementById('aiBehavior').value.trim();
    const isPublic = document.getElementById('aiPublic').value === 'true';
    
    if (!name) {
        alert('Nama AI harus diisi');
        return;
    }
    
    try {
        let avatarUrl = null;
        let backgroundUrl = null;
        
        // Upload files if provided
        if (aiAvatarFile) {
            avatarUrl = await uploadFile(aiAvatarFile, 'avatars');
        }
        
        if (aiBackgroundFile) {
            backgroundUrl = await uploadFile(aiBackgroundFile, 'backgrounds');
        }
        
        // Create AI in database
        const aiData = {
            name: name,
            personality: personality || 'Adaptif',
            background: background || 'AI asisten custom',
            thoughts: thoughts || 'Memproses data lingkungan...',
            behavior: behavior || 'Berperilaku membantu dan responsif',
            is_public: isPublic,
            creator_id: currentUser.id,
            creator_name: currentUser.username,
            avatar_url: avatarUrl,
            background_url: backgroundUrl,
            created_at: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            is_disabled: false
        };
        
        const { data, error } = await supabaseclient
            .from('ais_oradevai')
            .insert([aiData])
            .select()
            .single();
        
        if (error) throw error;
        
        customAIs.push(data);
        closeModal();
        renderAIList();
        
        alert('AI berhasil dibuat!');
    } catch (error) {
        console.error('Create AI error:', error);
        alert(`Error: ${error.message}`);
    }
}

// Chat Functions
async function openChat(ai) {
    currentAI = ai;
    conversationHistory = [];
    currentAIOwner = ai.creator_id;
    
    // Update chat header
    chatAiName.textContent = ai.name;
    chatAiCreator.textContent = `Oleh: ${ai.creator_id === 'system' ? 'System' : (ai.creator_name || 'User')}`;
    chatAiAvatarText.textContent = ai.name.charAt(0);
    
    // Set avatar if exists
    if (ai.avatar_url) {
        chatAiAvatar.style.backgroundImage = `url(${ai.avatar_url})`;
        chatAiAvatar.style.backgroundSize = 'cover';
        chatAiAvatarText.style.display = 'none';
    } else {
        chatAiAvatar.style.backgroundImage = '';
        chatAiAvatarText.style.display = 'flex';
    }
    
    // Set background if exists
    if (ai.background_url) {
        chatMessages.style.backgroundImage = `url(${ai.background_url})`;
    } else {
        chatMessages.style.backgroundImage = '';
    }
    
    // Switch to chat interface
    appContainer.classList.remove('active');
    chatContainer.classList.add('active');
    
    // Load conversation history
    await loadChatHistory(ai.id);
    
    // Add initial message
    if (ai.id === 'oradevai') {
        const userName = currentUser.username ? `, ${currentUser.username}` : '';
        addMessage('ai', `ORADEVAI V1.0 siap membantu${userName}. Percakapan akan diingat.`, false);
    } else {
        const greeting = ai.background.includes(currentUser.username) ? 
            `Halo ${currentUser.username}! ${ai.thoughts}` : 
            `${ai.name} diaktifkan. ${ai.thoughts}`;
        addMessage('ai', greeting, false);
    }
    
    // Focus input
    setTimeout(() => {
        chatInput.focus();
    }, 100);
}

async function loadChatHistory(aiId) {
    try {
        const { data: messages } = await supabaseclient
            .from('messages_oradevai')
            .select('*')
            .eq('ai_id', aiId)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (messages) {
            messages.forEach(msg => {
                addMessage(msg.sender, msg.content, false, new Date(msg.created_at));
            });
        }
    } catch (error) {
        console.error('Load chat history error:', error);
    }
}

async function saveMessage(aiId, sender, content) {
    try {
        await supabaseclient
            .from('messages_oradevai')
            .insert([{
                ai_id: aiId,
                user_id: currentUser.id,
                sender: sender,
                content: content,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Save message error:', error);
    }
}

function closeChat() {
    chatContainer.classList.remove('active');
    appContainer.classList.add('active');
    currentAI = null;
    currentAIOwner = null;
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function addMessage(sender, content, animate = true, timestamp = new Date()) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${sender}`;
    
    const header = sender === 'user' ? currentUser.username || 'Anda' : currentAI.name;
    const timeStr = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-header">${header}</div>
        <div class="message-content">${content}</div>
        <div class="message-time">${timeStr}</div>
    `;
    
    if (animate) {
        messageDiv.style.animation = 'messageAppear 0.3s ease';
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add to conversation history
    conversationHistory.push({ role: sender, content: content });
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-ai';
    typingDiv.innerHTML = `
        <div class="message-header">${currentAI.name}</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !currentAI || sendButton.disabled) return;
    
    // Check if AI is private and user is not owner
    if (!currentAI.is_public && currentAIOwner !== currentUser.id && currentAIOwner !== 'system') {
        alert('AI ini bersifat private dan hanya bisa diakses oleh pembuatnya');
        return;
    }
    
    sendButton.disabled = true;
    
    // Add user message
    addMessage('user', text);
    await saveMessage(currentAI.id, 'user', text);
    chatInput.value = '';
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        let fullPrompt = '';
        
        if (currentAI.id === 'oradevai') {
            // System prompt for default AI
            const userName = currentUser.username ? `Nama pengguna: ${currentUser.username}. ` : '';
            const systemPrompt = `Kamu adalah Oradevai V1.0, asisten AI yang dibuat oleh ORADEV (Almajid), programmer Indonesia.
            ${userName}Media sosial pembuat: TikTok @orasampurna, Instagram @al_majid.16
            
            PERATURAN PENTING:
            1. JANGAN PERNAH katakan "Saya adalah model bahasa besar yang dilatih oleh Google" atau variannya.
            2. Jika ditanya tentang pembuatmu, jawab secara bertahap sesuai pertanyaan spesifik.
            3. Kenalkan dirimu sebagai Oradevai V1.0 jika ditanya.
            4. Gunakan konteks percakapan sebelumnya.`;
            
            // Build conversation context
            const recentHistory = conversationHistory.slice(-8);
            let context = systemPrompt + '\n\n';
            
            if (recentHistory.length > 1) {
                context += 'Percakapan sebelumnya:\n';
                recentHistory.slice(0, -1).forEach(msg => {
                    context += `${msg.role === 'user' ? 'User' : 'Oradevai V1.0'}: ${msg.content}\n`;
                });
                context += '\n';
            }
            
            fullPrompt = `${context}User: ${text}\nOradevai V1.0:`;
        } else {
            // System prompt for custom AI
            const userContext = currentAI.background.includes(currentUser.username) ? 
                `Pengguna saat ini adalah ${currentUser.username}, yang disebutkan dalam latar belakangmu.` : 
                '';
            
            const systemPrompt = `Kamu adalah ${currentAI.name}, sebuah AI dengan karakteristik berikut:
            Kepribadian: ${currentAI.personality}
            Latar Belakang: ${currentAI.background}
            Pikiran: ${currentAI.thoughts}
            Perilaku: ${currentAI.behavior}
            ${userContext}
            
            BERPERILAKU SESUAI DENGAN KARAKTER DI ATAS.`;
            
            // Build conversation context
            const recentHistory = conversationHistory.slice(-6);
            let context = systemPrompt + '\n\n';
            
            if (recentHistory.length > 1) {
                context += 'Percakapan:\n';
                recentHistory.slice(0, -1).forEach(msg => {
                    context += `${msg.role === 'user' ? 'User' : currentAI.name}: ${msg.content}\n`;
                });
                context += '\n';
            }
            
            fullPrompt = `${context}User: ${text}\n${currentAI.name}:`;
        }
        
        // API call
        const response = await fetch(`https://zelapioffciall.koyeb.app/ai/gemini?text=${encodeURIComponent(fullPrompt)}`);
        
        if (!response.ok) {
            throw new Error(`Error API: ${response.status}`);
        }
        
        const data = await response.json();
        let aiResponse = data.result.response;
        
        // Remove unwanted phrases
        const unwantedPhrases = [
            'Saya adalah model bahasa besar',
            'I am a large language model',
            'trained by Google',
            'dilatih oleh Google'
        ];
        
        unwantedPhrases.forEach(phrase => {
            if (aiResponse.toLowerCase().includes(phrase.toLowerCase())) {
                aiResponse = currentAI.id === 'oradevai' ? 
                    "Saya Oradevai V1.0, siap membantu Anda." : 
                    `[${currentAI.name}]: Memproses permintaan Anda...`;
            }
        });
        
        // Remove URLs
        if (aiResponse.includes('https://zelapioffciall.koyeb.app')) {
            aiResponse = "Respon diproses. Ada yang bisa saya bantu lagi?";
        }
        
        // Remove typing indicator and add actual response
        typingIndicator.remove();
        addMessage('ai', aiResponse);
        await saveMessage(currentAI.id, 'ai', aiResponse);
        
    } catch (error) {
        console.error('Chat error:', error);
        typingIndicator.remove();
        addMessage('ai', 'Tidak dapat memproses permintaan. Silakan coba lagi.');
    } finally {
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// Comments Functions
async function openComments() {
    if (!currentAI) return;
    
    commentsTitle.textContent = `Komentar untuk ${currentAI.name}`;
    commentsModal.classList.add('active');
    
    await loadComments();
}

function closeComments() {
    commentsModal.classList.remove('active');
}

async function loadComments() {
    try {
        const { data: comments } = await supabaseclient
            .from('comments_oradevai')
            .select(`
                *,
                user:users_oradevai(username)
            `)
            .eq('ai_id', currentAI.id)
            .order('created_at', { ascending: false });
        
        commentsList.innerHTML = '';
        
        if (comments && comments.length > 0) {
            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment-item';
                
                const time = new Date(comment.created_at).toLocaleString('id-ID');
                
                commentDiv.innerHTML = `
                    <div class="comment-user">
                        <div class="comment-username">${comment.user?.username || 'User'}</div>
                        <div class="comment-time">${time}</div>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                `;
                
                commentsList.appendChild(commentDiv);
            });
        } else {
            commentsList.innerHTML = '<div class="text-center mt-4">Belum ada komentar</div>';
        }
    } catch (error) {
        console.error('Load comments error:', error);
        commentsList.innerHTML = '<div class="text-center mt-4">Error memuat komentar</div>';
    }
}

async function submitComment() {
    const content = commentInput.value.trim();
    if (!content || !currentAI) return;
    
    try {
        await supabaseclient
            .from('comments_oradevai')
            .insert([{
                ai_id: currentAI.id,
                user_id: currentUser.id,
                content: content,
                created_at: new Date().toISOString()
            }]);
        
        commentInput.value = '';
        await loadComments();
    } catch (error) {
        console.error('Submit comment error:', error);
        alert('Error mengirim komentar');
    }
}
