// Chỉ cho phép truy cập khi đã đăng nhập
if (!isLoggedIn()) {
    location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const profileContent = document.getElementById("profileContent");

const PLACEHOLDER_AVATAR =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <rect width="100%" height="100%" fill="#282828"/>
            <text x="50%" y="50%" fill="#6a6a6a" font-size="16"
                text-anchor="middle" dy=".3em" font-family="sans-serif">
                Avatar
            </text>
        </svg>
    `);

function renderProfile(user, stats) {
    const avatar = user.avatar_url || PLACEHOLDER_AVATAR;

    document.getElementById("profileAvatar").src = avatar;

    document.getElementById("profileAvatar").onerror = function () {
        this.src = PLACEHOLDER_AVATAR;
    };

    document.getElementById("profileName").textContent = user.display_name;

    document.getElementById("profileUsername").textContent = `@${user.username}`;

    document.getElementById("profileEmail").textContent = user.email;

    document.getElementById("profileId").textContent = user.id;

    document.getElementById("profileCreatedAt").textContent = new Date(user.created_at).toLocaleDateString("vi-VN");

    document.getElementById("playlistCount").textContent = stats.playlists;

    document.getElementById("followingCount").textContent = stats.following;

    document.getElementById("playsCount").textContent = stats.plays;
}

async function loadProfile() {
    try {
        const json = await apiFetch("/api/users/me");
        const user = json.user;
        const stats = json.stats;

        if (!user) {
            throw new Error("Không nhận được dữ liệu người dùng.");
        }

        setStoredUser(user);
        renderProfile(user, stats);

        loadingState.classList.add("hidden");
        profileContent.classList.remove("hidden");
    } catch (err) {
        loadingState.classList.add("hidden");

        errorState.textContent = err.message || "Không thể tải thông tin cá nhân.";

        errorState.classList.remove("hidden");
    }
}

loadProfile();
