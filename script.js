// ---------- GLOBAL STATE ----------
let currentUser = null;
let allMovies = [];         // from API
let trendingMovies = [];
let recentMovies = [];

// DOM elements
const authOverlay = document.getElementById('auth-overlay');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout-btn');
const globalSearch = document.getElementById('global-search-input');
const searchBtn = document.getElementById('global-search-btn');

// Helper: load movies from free movie API (sampleapis drama)
async function fetchMovies() {
    try {
        const res = await fetch('https://api.sampleapis.com/movies/drama');
        let data = await res.json();
        allMovies = data.slice(0, 40).map((m, idx) => ({
            id: m.id,
            title: m.title || 'Untitled',
            year: m.year || 2000 + (idx % 20),
            poster: m.poster || `https://picsum.photos/id/${idx+10}/300/450`,
            description: m.description || 'A royal cinematic masterpiece.',
            genre: 'Drama'
        }));
        // create trending (first 12) and recent (random 12)
        trendingMovies = allMovies.slice(0, 12);
        recentMovies = [...allMovies].sort(() => 0.5 - Math.random()).slice(0, 12);
        renderCarousel('trending-carousel', trendingMovies);
        renderCarousel('recent-carousel', recentMovies);
        renderWatchlist();
    } catch(e) {
        console.warn("fallback movies");
        allMovies = [
            {id:1, title:"The Royal Redemption", year:2024, poster:"https://picsum.photos/id/100/300/450", description:"Epic"},
            {id:2, title:"Golden Era", year:2023, poster:"https://picsum.photos/id/101/300/450", description:"Golden"},
            {id:3, title:"Midnight Dynasty", year:2025, poster:"https://picsum.photos/id/102/300/450", description:"Intrigue"}
        ];
        trendingMovies = allMovies;
        recentMovies = allMovies;
        renderCarousel('trending-carousel', trendingMovies);
        renderCarousel('recent-carousel', recentMovies);
        renderWatchlist();
    }
}

// Render any carousel
function renderCarousel(containerId, moviesArray) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    moviesArray.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster}" onerror="this.src='https://via.placeholder.com/300x450'">
            <div class="movie-info">
                <h4>${movie.title}</h4>
                <button class="watchlist-btn" data-id="${movie.id}" data-action="add">➕</button>
            </div>
        `;
        card.querySelector('.watchlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie.id);
        });
        card.addEventListener('click', () => openPlayer(movie));
        container.appendChild(card);
    });
}

// Watchlist CRUD (localStorage per user)
function getUserWatchlist() {
    if(!currentUser) return [];
    const users = JSON.parse(localStorage.getItem('cineplay_users') || '[]');
    const user = users.find(u => u.email === currentUser.email);
    return user?.watchlist || [];
}

function saveUserWatchlist(watchlist) {
    let users = JSON.parse(localStorage.getItem('cineplay_users') || '[]');
    const idx = users.findIndex(u => u.email === currentUser.email);
    if(idx !== -1) {
        users[idx].watchlist = watchlist;
        localStorage.setItem('cineplay_users', JSON.stringify(users));
        currentUser.watchlist = watchlist;
        localStorage.setItem('cineplay_current', JSON.stringify(currentUser));
        renderWatchlist();
    }
}

function toggleWatchlist(movieId) {
    let watchlist = getUserWatchlist();
    const exists = watchlist.some(m => m.id == movieId);
    if(exists) {
        watchlist = watchlist.filter(m => m.id != movieId);
    } else {
        const movie = allMovies.find(m => m.id == movieId);
        if(movie) watchlist.push(movie);
    }
    saveUserWatchlist(watchlist);
}

function renderWatchlist() {
    const container = document.getElementById('watchlist-carousel');
    const emptyMsg = document.getElementById('watchlist-empty-msg');
    const watchlist = getUserWatchlist();
    if(!container) return;
    if(watchlist.length === 0) {
        container.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';
    container.innerHTML = '';
    watchlist.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster}" onerror="this.src='https://via.placeholder.com/300x450'">
            <div class="movie-info">
                <h4>${movie.title}</h4>
                <button class="watchlist-btn" data-id="${movie.id}" data-action="remove">❌</button>
            </div>
        `;
        card.querySelector('.watchlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie.id);
        });
        card.addEventListener('click', () => openPlayer(movie));
        container.appendChild(card);
    });
}

// Player modal
function openPlayer(movie) {
    const modal = document.getElementById('video-modal');
    document.getElementById('video-movie-title').innerText = movie.title;
    document.getElementById('video-movie-desc').innerText = movie.description;
    modal.style.display = 'flex';
    const video = document.getElementById('trailer-video');
    if (video) video.load();
}

const closeModalBtn = document.querySelector('.close-modal');
if(closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        document.getElementById('video-modal').style.display = 'none';
        const video = document.getElementById('trailer-video');
        if(video) video.pause();
    });
}

// Authentication 
// (Note: login still uses localStorage for now. You will want to update it to use fetch('login.php') later!)
// --- UPDATED MYSQL LOGIN LOGIC ---
document.getElementById('do-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (!email || !pass) {
        document.getElementById('login-error').innerText = 'Please fill in all fields';
        return;
    }

    try {
        // Ask the PHP server if the user exists and the password is correct
        const response = await fetch('login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
        });

        const result = await response.json();

        if (result.success) {
            // Login worked! Save the database user to our global state
            currentUser = result.user;
            
            // Make sure the watchlist array exists so our UI doesn't crash
            currentUser.watchlist = []; 
            
            // Save the active session locally so they stay logged in when they refresh
            localStorage.setItem('cineplay_current', JSON.stringify(currentUser));

            // Hide the login screen and load the movies
            authOverlay.style.display = 'none';
            mainApp.style.display = 'block';
            fetchMovies();
            
        } else {
            // Display the exact error (e.g., "Invalid email or password")
            document.getElementById('login-error').innerText = result.message || 'Login failed';
        }
        
    } catch (error) {
        console.error("Network/Fetch Error:", error);
        document.getElementById('login-error').innerText = "Failed to connect to server.";
    }
});
async function logout() {
    try {
        // 1. Tell the PHP server to destroy the backend session
        await fetch('logout.php');
    } catch (error) {
        console.error("Server logout failed, but clearing local session anyway.", error);
    }

    // 2. Clear the frontend memory
    currentUser = null;
    localStorage.removeItem('cineplay_current');

    // 3. Kick the user back to the login screen
    authOverlay.style.display = 'flex';
    mainApp.style.display = 'none';
}
function loadSession() {
    const saved = localStorage.getItem('cineplay_current');
    if(saved) {
        currentUser = JSON.parse(saved);
        authOverlay.style.display = 'none';
        mainApp.style.display = 'block';
        fetchMovies();
    } else {
        authOverlay.style.display = 'flex';
        mainApp.style.display = 'none';
    }
}

// Event listeners
document.getElementById('do-login').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    if(login(email, pass)) loadSession();
    else document.getElementById('login-error').innerText = 'Invalid credentials';
});

// --- UPDATED MYSQL REGISTRATION LOGIC ---
document.getElementById('do-register').addEventListener('click', async () => {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;

    if(pass.length < 6) { 
        document.getElementById('reg-error').innerText = 'Password min 6 chars'; 
        return; 
    }

    try {
        // Send data to the PHP backend
        const response = await fetch('register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, email: email, password: pass })
        });

        const result = await response.json();

        if (result.success) {
            alert('Registered successfully! Please login.');
            document.querySelector('[data-tab="login-tab"]').click();
        } else {
            // Display the error from PHP
            document.getElementById('reg-error').innerText = result.message || 'Registration failed';
            
            // Prints the exact MySQL error to your console if one occurs
            if(result.database_error) {
                console.error("MySQL Error:", result.database_error); 
            }
        }
    } catch (error) {
        console.error("Network/Fetch Error:", error);
        document.getElementById('reg-error').innerText = "Failed to connect to server.";
    }
});
// ----------------------------------------

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active-panel'));
        document.getElementById(btn.dataset.tab).classList.add('active-panel');
    });
});

logoutBtn.addEventListener('click', logout);

// Carousel sliding
function initCarousels() {
    document.querySelectorAll('.carousel-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const container = document.getElementById(target === 'trending' ? 'trending-carousel' : (target === 'recent' ? 'recent-carousel' : 'watchlist-carousel'));
            if(container) container.scrollBy({ left: -300, behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.carousel-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const container = document.getElementById(target === 'trending' ? 'trending-carousel' : (target === 'recent' ? 'recent-carousel' : 'watchlist-carousel'));
            if(container) container.scrollBy({ left: 300, behavior: 'smooth' });
        });
    });
}

// Global search
searchBtn.addEventListener('click', () => {
    const query = globalSearch.value.toLowerCase();
    if(!query) return;
    const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query));
    if(filtered.length) {
        renderCarousel('trending-carousel', filtered);
        alert(`Found ${filtered.length} movies. Check Trending section.`);
    } else alert('No movies found');
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

// Newsletter mock
document.getElementById('newsletter-subscribe').addEventListener('click', () => {
    const email = document.getElementById('newsletter-email').value;
    if(email) alert(`Thanks ${email} for subscribing to royal updates!`);
});

// Featured play button
document.getElementById('featured-play').addEventListener('click', () => {
    if(trendingMovies) openPlayer(trendingMovies);
});

// Nav links (simple page indication)
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        if(link.innerText === 'My List') {
            renderWatchlist();
            document.getElementById('watchlist-section').scrollIntoView({ behavior: 'smooth' });
        } else if(link.innerText === 'Movies') {
            renderCarousel('trending-carousel', allMovies);
            alert('Showing all movies in Trending section');
        }
    });
});

// Start app
loadSession();
initCarousels();