// Bắt buộc đăng nhập mới được xem trang chủ
if (!isLoggedIn()) {
    location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);

const SECTIONS = [
    { key: "artists", endpoint: "/api/artists?limit=20&offset=0", arrKey: "artists", type: "artist", rounded: true },
    { key: "albums", endpoint: "/api/albums?limit=20&offset=0", arrKey: "albums", type: "album", rounded: false },
    { key: "tracks", endpoint: "/api/tracks?limit=50&offset=0", arrKey: "tracks", type: "track", rounded: false },
    {
        key: "playlists",
        endpoint: "/api/playlists?limit=50&offset=0",
        arrKey: "playlists",
        type: "playlist",
        rounded: false,
    },
];

function setSectionState(key, kind, message) {
    const stateEl = document.getElementById(`${key}State`);
    const rowEl = document.getElementById(`${key}Row`);

    if (kind === "loading") {
        stateEl.innerHTML = `
      <div class="flex items-center gap-3 py-4">
        <div class="spinner"></div>
        <span class="text-sm" style="color: var(--text-muted)">Đang tải dữ liệu...</span>
      </div>`;
        rowEl.innerHTML = "";
    } else if (kind === "error") {
        stateEl.innerHTML = `
      <div class="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg px-4 py-3">
        ${message}
      </div>`;
        rowEl.innerHTML = "";
    } else if (kind === "empty") {
        stateEl.innerHTML = `
      <div class="text-sm py-2" style="color: var(--text-muted)">Chưa có dữ liệu để hiển thị.</div>`;
        rowEl.innerHTML = "";
    } else {
        stateEl.innerHTML = "";
    }
}

function renderCard(item, type, rounded) {
    const image = getItemImage(item);
    const title = getItemTitle(item);
    const subtitle = getItemSubtitle(item, type);

    return `
    <div class="media-card flex-shrink-0 w-40 rounded-lg p-3 cursor-default">
      <img src="${image}" alt="${title}"
           class="w-full h-36 object-cover mb-3 ${rounded ? "avatar-circle" : "rounded-md"}"
           onerror="this.src='${PLACEHOLDER_IMAGE}'">
      <p class="font-semibold text-sm truncate">${title}</p>
      <p class="text-xs mt-1 truncate" style="color: var(--text-muted)">${subtitle}</p>
    </div>
  `;
}

async function loadSection(section) {
    setSectionState(section.key, "loading");
    try {
        const json = await apiFetch(section.endpoint);
        const { list } = normalizeList(json, section.arrKey);

        if (!list.length) {
            setSectionState(section.key, "empty");
            return;
        }

        setSectionState(section.key, "ok");
        document.getElementById(`${section.key}Row`).innerHTML = list
            .map((item) => renderCard(item, section.type, section.rounded))
            .join("");
    } catch (err) {
        setSectionState(section.key, "error", err.message || "Không thể tải dữ liệu.");
    }
}

SECTIONS.forEach(loadSection);
