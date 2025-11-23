
let currentUser = null;        // Jo user abhi login hai
let users = JSON.parse(localStorage.getItem('wibba_users')) || [];     // Sab users ki list
let posts = JSON.parse(localStorage.getItem('wibba_posts')) || [];     // Sab posts
let viewingUser = null;        // Jis user ka profile dekh rahe hain (doosre ka)
let editingPostId = null;      // Kaunsi post edit ho rahi hai (ID)

// Jab page load ho jaye
document.addEventListener('DOMContentLoaded', () => {
  checkAuth(); // Check karo koi pehle se login toh nahi?
  document.getElementById('authBtn').onclick = handleAuth; // Login/Signup button
});

// ==================== AUTHENTICATION ====================

function checkAuth() {
  const saved = localStorage.getItem('wibba_current');
  if (saved) {
    currentUser = JSON.parse(saved);
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    showPage('home'); // Direct home page dikhao
  }
}

// Login ya Signup handle karta hai
function handleAuth() {
  const name = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const pass = document.getElementById('authPass').value;

  if (!email || !pass) return alert("Saare fields bharo!");

  const isSignup = document.getElementById('authTitle').textContent.includes('Create');

  if (isSignup) {
    // ====== SIGN UP ======
    if (users.find(u => u.email === email)) return alert("Ye email pehle se registered hai!");
    
    const newUser = {
      id: Date.now(),
      name: name || email.split('@')[0],
      email,
      password: pass,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + email,
      bio: "Hey! I'm using WIBBA.",
      followers: [],
      following: []
    };
    users.push(newUser);
    currentUser = newUser;
  } else {
    // ====== LOGIN ======
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) return alert("Email ya password galat hai!");
    currentUser = user;
  }

  // Save current user aur users list localStorage mein
  localStorage.setItem('wibba_current', JSON.stringify(currentUser));
  localStorage.setItem('wibba_users', JSON.stringify(users));
  checkAuth(); // Refresh UI
}

// Login <-> Signup screen toggle
function toggleAuth() {
  const isLogin = document.getElementById('authTitle').textContent === "Welcome Back";
  document.getElementById('authTitle').textContent = isLogin ? "Create Account" : "Welcome Back";
  document.getElementById('authBtn').textContent = isLogin ? "Sign Up" : "Login";
  document.getElementById('authName').style.display = isLogin ? "block" : "none";
  document.getElementById('authSwitchText').innerHTML = isLogin
    ? 'Already have an account? <span onclick="toggleAuth()" class="switch-link">Login</span>'
    : 'New here? <span onclick="toggleAuth()" class="switch-link">Sign Up</span>';
}

function logout() {
  localStorage.removeItem('wibba_current');
  location.reload();
}

// ==================== PAGE NAVIGATION ====================

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(page + 'Page').classList.remove('hidden');

  if (page === 'home') renderFeed();
  if (page === 'dashboard') renderDashboard();
  if (page === 'profile') loadProfileEdit();
}

// ==================== POSTS ====================

// Naya post banane ka function
function createPost() {
  if (editingPostId) return alert("Pehle editing complete karo!");
  const text = document.getElementById('postText').value.trim();
  const image = document.getElementById('postImage').value.trim();
  if (!text) return alert("Kuch toh likho!");

  const post = {
    id: Date.now(),
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorAvatar: currentUser.avatar,
    text,
    image: image || null,
    likes: [],
    comments: [],
    timestamp: new Date().toISOString()
  };

  posts.unshift(post); // Naya post top pe
  localStorage.setItem('wibba_posts', JSON.stringify(posts));

  // Form clear karo
  document.getElementById('postText').value = '';
  document.getElementById('postImage').value = '';

  renderDashboard();
  renderFeed();
}

// Comment add karne ka function
function addComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id === postId);
  post.comments.push({
    id: Date.now(),
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar,
    text,
    timestamp: new Date().toISOString()
  });

  localStorage.setItem('wibba_posts', JSON.stringify(posts));
  input.value = '';
  renderFeed(); // Feed refresh karo taake comment dikhe
}

// Post edit karne ke liye form bhar deta hai
function editPost(id) {
  const post = posts.find(p => p.id === id);
  if (!post || post.authorId !== currentUser.id) return;

  editingPostId = id;
  document.getElementById('postText').value = post.text;
  document.getElementById('postImage').value = post.image || '';
  document.getElementById('formTitle').textContent = "Edit Your Post";

  // Buttons change karo
  document.getElementById('mainPostBtn').classList.add('hidden');
  document.getElementById('updatePostBtn').classList.remove('hidden');
  document.getElementById('cancelEditBtn').classList.remove('hidden');

  // Form pe scroll karo
  document.querySelector('.create-post-card').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('postText').focus();
}

// Edit kiya hua post save karo
function savePostEdit() {
  if (!editingPostId) return;
  const post = posts.find(p => p.id === editingPostId);
  const text = document.getElementById('postText').value.trim();
  if (!text) return alert("Post khali nahi ho sakta!");

  post.text = text;
  post.image = document.getElementById('postImage').value.trim() || null;

  localStorage.setItem('wibba_posts', JSON.stringify(posts));
  cancelEdit();
  renderFeed();
  renderDashboard();
  alert("Post updated!");
}

// Editing cancel karo
function cancelEdit() {
  editingPostId = null;
  document.getElementById('postText').value = '';
  document.getElementById('postImage').value = '';
  document.getElementById('formTitle').textContent = "What's on your mind today?";
  document.getElementById('mainPostBtn').classList.remove('hidden');
  document.getElementById('updatePostBtn').classList.add('hidden');
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

// Post delete karo
function deletePost(id) {
  if (confirm("Ye post delete karna chahte ho?")) {
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem('wibba_posts', JSON.stringify(posts));
    renderFeed();
    renderDashboard();
  }
}

// ==================== FEED RENDERING ====================

function renderFeed() {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  let list = [...posts];

  // Search functionality
  const query = document.getElementById('searchInput').value.toLowerCase();
  if (query) list = list.filter(p => p.text.toLowerCase().includes(query));

  // Sorting
  const sort = document.getElementById('sortSelect').value;
  if (sort === 'latest') list.sort((a, b) => b.id - a.id);
  if (sort === 'oldest') list.sort((a, b) => a.id - b.id);
  if (sort === 'mostLiked') list.sort((a, b) => b.likes.length - a.likes.length);

  if (list.length === 0) {
    feed.innerHTML = `<p style="text-align:center;color:#888;padding:60px;">No posts found.</p>`;
    return;
  }

  list.forEach(post => {
    const isMine = post.authorId === currentUser.id;
    const isLiked = post.likes.includes(currentUser.id);
    const time = new Date(post.timestamp).toLocaleString();

    const el = document.createElement('div');
    el.className = 'post-card';
    el.innerHTML = `
      <div class="post-header" onclick="openUserProfile(${post.authorId})">
        <img src="${post.authorAvatar}" class="avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}'">
        <div>
          <h4>${post.authorName}</h4>
          <div class="time">${time}</div>
        </div>
        ${!isMine ? `<button class="follow-btn ${currentUser.following.includes(post.authorId) ? 'following' : ''}" 
                      onclick="event.stopPropagation(); toggleFollow(${post.authorId})">
          ${currentUser.following.includes(post.authorId) ? 'Following' : 'Follow'}
        </button>` : ''}
      </div>
      <div class="post-content">${post.text}</div>
      ${post.image ? `<img src="${post.image}" class="post-image" onerror="this.style.display='none'">` : ''}
      <div class="post-actions">
        <div class="left-actions">
          <span class="reaction-btn ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); likePost(${post.id})">❤️</span>
          <span class="comment-btn" onclick="event.stopPropagation(); document.getElementById('commentInput-${post.id}').focus()">Comment</span>
        </div>
        <span>${post.likes.length} likes • ${post.comments.length} comments</span>
      </div>

      <div class="post-comments">
        <div class="comments-list" id="comments-${post.id}">
          ${post.comments.map(c => `
            <div class="comment-item">
              <img src="${c.userAvatar}" class="comment-avatar">
              <div class="comment-content">
                <strong onclick="openUserProfile(${c.userId})" style="cursor:pointer;color:#1a77f2;">${c.userName}</strong>
                <p>${c.text}</p>
                <small>${new Date(c.timestamp).toLocaleTimeString()}</small>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="add-comment">
          <img src="${currentUser.avatar}" class="comment-avatar">
          <input type="text" id="commentInput-${post.id}" placeholder="Write a comment..." 
                 onkeypress="if(event.key==='Enter') addComment(${post.id})">
          <button onclick="addComment(${post.id})">Send</button>
        </div>
      </div>
    `;
    feed.appendChild(el);
  });
}

// Like / Unlike post
function likePost(id) {
  const post = posts.find(p => p.id === id);
  const index = post.likes.indexOf(currentUser.id);
  if (index === -1) {
    post.likes.push(currentUser.id);
  } else {
    post.likes.splice(index, 1);
  }
  localStorage.setItem('wibba_posts', JSON.stringify(posts));
  renderFeed();
}

// ==================== PROFILE & FOLLOW SYSTEM ====================

function openUserProfile(userId) {
  if (userId === currentUser.id) {
    showPage('profile');
    return;
  }
  viewingUser = users.find(u => u.id === userId);
  if (!viewingUser) return;

  document.getElementById('viewAvatar').src = viewingUser.avatar;
  document.getElementById('viewName').textContent = viewingUser.name;
  document.getElementById('viewBio').textContent = viewingUser.bio || "No bio yet.";
  document.getElementById('viewPosts').textContent = posts.filter(p => p.authorId === viewingUser.id).length;
  document.getElementById('viewFollowers').textContent = viewingUser.followers.length;
  document.getElementById('viewFollowing').textContent = viewingUser.following.length;

  const isFollowing = currentUser.following.includes(viewingUser.id);
  const btn = document.getElementById('followBtn');
  btn.textContent = isFollowing ? "Following" : "Follow";
  btn.className = isFollowing ? "follow-btn following" : "follow-btn";

  showPage('userProfile');
}

// Follow / Unfollow toggle
function toggleFollow(userId) {
  if (!viewingUser && userId) viewingUser = users.find(u => u.id === userId);
  if (!viewingUser) return;

  const idx = currentUser.following.indexOf(viewingUser.id);
  if (idx === -1) {
    currentUser.following.push(viewingUser.id);
    viewingUser.followers.push(currentUser.id);
  } else {
    currentUser.following.splice(idx, 1);
    viewingUser.followers.splice(viewingUser.followers.indexOf(currentUser.id), 1);
  }

  localStorage.setItem('wibba_current', JSON.stringify(currentUser));
  localStorage.setItem('wibba_users', JSON.stringify(users));
  renderFeed();
  if (!document.getElementById('userProfilePage').classList.contains('hidden')) {
    openUserProfile(viewingUser.id);
  }
}

// ==================== DASHBOARD (My Posts) ====================

function renderDashboard() {
  document.getElementById('dashAvatar').src = currentUser.avatar;
  document.getElementById('dashName').textContent = currentUser.name;
  document.getElementById('dashBio').textContent = currentUser.bio;
  document.getElementById('postCount').textContent = posts.filter(p => p.authorId === currentUser.id).length;
  document.getElementById('followerCount').textContent = currentUser.followers.length;
  document.getElementById('followingCount').textContent = currentUser.following.length;

  const container = document.getElementById('myPosts');
  container.innerHTML = ''; // Clear pehle

  const myPostsList = posts.filter(p => p.authorId === currentUser.id).reverse();

  if (myPostsList.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#777;padding:50px;font-size:17px;">No posts yet. Be the first to post!</p>';
    return;
  }

  myPostsList.forEach(post => {
    const date = new Date(post.timestamp).toLocaleDateString('en-GB');
    container.innerHTML += `
      <div class="my-post-card">
        <div class="my-post-text">${post.text}</div>
        ${post.image ? `<img src="${post.image}" class="my-post-img" onerror="this.style.display='none'">` : ''}
        <div class="my-post-info">
          <small>${date} • ${post.likes.length} likes</small>
        </div>
        <div class="my-post-buttons">
          <button onclick="editPost(${post.id})" class="btn-edit">Edit</button>
          <button onclick="deletePost(${post.id})" class="btn-delete">Delete</button>
        </div>
      </div>
    `;
  });
}

// ==================== PROFILE EDIT ====================

function loadProfileEdit() {
  document.getElementById('profileAvatar').src = currentUser.avatar;
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileBio').textContent = currentUser.bio;
  document.getElementById('editName').value = currentUser.name;
  document.getElementById('editAvatar').value = currentUser.avatar;
  document.getElementById('editBio').value = currentUser.bio;
  document.getElementById('profilePosts').textContent = posts.filter(p => p.authorId === currentUser.id).length;
  document.getElementById('profileFollowers').textContent = currentUser.followers.length;
  document.getElementById('profileFollowing').textContent = currentUser.following.length;
}

function saveProfile() {
  currentUser.name = document.getElementById('editName').value.trim() || "User";
  currentUser.avatar = document.getElementById('editAvatar').value.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`;
  currentUser.bio = document.getElementById('editBio').value.trim() || "Hey! I'm using WIBBA.";

  localStorage.setItem('wibba_current', JSON.stringify(currentUser));
  users = users.map(u => u.id === currentUser.id ? currentUser : u);
  localStorage.setItem('wibba_users', JSON.stringify(users));

  alert("Profile Updated!");
  loadProfileEdit();
  renderDashboard();
}

// Account settings (name/password change)
function updateAccount() {
  const newName = document.getElementById('newName').value.trim();
  const newPass = document.getElementById('newPass').value;
  if (newName) currentUser.name = newName;
  if (newPass) currentUser.password = newPass;

  localStorage.setItem('wibba_current', JSON.stringify(currentUser));
  users = users.map(u => u.id === currentUser.id ? currentUser : u);
  localStorage.setItem('wibba_users', JSON.stringify(users));
  alert("Account updated!");
}


// Mobile menu toggle
function toggleMobileMenu() {
  const dropdown = document.getElementById('mobileDropdown');
  dropdown.classList.toggle('hidden');

  // Jab menu khule to user info update kar do
  if (!dropdown.classList.contains('hidden') && currentUser) {
    document.getElementById('mobileAvatar').src = currentUser.avatar;
    document.getElementById('mobileName').textContent = currentUser.name;
    document.getElementById('mobileEmail').textContent = currentUser.email.split('@')[0];
  }
}

// Click outside to close dropdown
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('mobileDropdown');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  
  if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});