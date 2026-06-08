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
    video.load();
}
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('video-modal').style.display = 'none';
    document.getElementById('trailer-video').pause();
});

// Authentication
function register(name, email, pass) {
    let users = JSON.parse(localStorage.getItem('cineplay_users') || '[]');
    if(users.find(u => u.email === email)) return false;
    users.push({ email, name, password: btoa(pass), watchlist: [], memberSince: new Date().toISOString() });
    localStorage.setItem('cineplay_users', JSON.stringify(users));
    return true;
}
function login(email, pass) {
    let users = JSON.parse(localStorage.getItem('cineplay_users') || '[]');
    const user = users.find(u => u.email === email && atob(u.password) === pass);
    if(user) {
        currentUser = { ...user, password: undefined };
        localStorage.setItem('cineplay_current', JSON.stringify(currentUser));
        return true;
    }
    return false;
}
function logout() {
    currentUser = null;
    localStorage.removeItem('cineplay_current');
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
document.getElementById('do-register').addEventListener('click', () => {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    if(pass.length < 6) { document.getElementById('reg-error').innerText = 'Password min 6 chars'; return; }
    if(register(name, email, pass)) {
        alert('Registered! Please login.');
        document.querySelector('[data-tab="login-tab"]').click();
    } else document.getElementById('reg-error').innerText = 'Email exists';
});
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
    if(trendingMovies[0]) openPlayer(trendingMovies[0]);
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