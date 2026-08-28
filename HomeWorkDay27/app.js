// ===== Tên bạn dùng cho utm_source (đổi lại thành tên của bạn) =====
const MY_NAME = "Trần Đình Quảng Đại";

const viewHome = document.getElementById("viewHome");
const viewFingerprint = document.getElementById("viewFingerprint");

// ---------- 1. Vị trí người dùng ----------
const elLocation = document.getElementById("infoLocation");
function readLocation() {
    if (!navigator.geolocation) {
        elLocation.textContent = "Trình duyệt không hỗ trợ Geolocation";
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            elLocation.textContent = `Vĩ độ: ${pos.coords.latitude.toFixed(5)}, Kinh độ: ${pos.coords.longitude.toFixed(5)}`;
        },
        (err) => {
            elLocation.textContent = "Không lấy được vị trí (bị từ chối hoặc lỗi)";
        },
    );
}
readLocation();

// ---------- 2. Trạng thái online ----------
const elOnline = document.getElementById("infoOnline");
const dot = document.getElementById("dot");
function renderOnlineStatus() {
    if (navigator.onLine) {
        elOnline.textContent = "Online";
        dot.className = "w-4 h-4 rounded-full bg-green-500 inline-block shadow";
    } else {
        elOnline.textContent = "Offline";
        dot.className = "w-4 h-4 rounded-full bg-red-500 inline-block shadow";
    }
}
renderOnlineStatus();
window.addEventListener("online", renderOnlineStatus);
window.addEventListener("offline", renderOnlineStatus);

// ---------- 3. Tên trình duyệt ----------
function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "Microsoft Edge";
    if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
    if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Google Chrome";
    if (ua.includes("Firefox/")) return "Mozilla Firefox";
    if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
    return "Không xác định";
}
const browserName = detectBrowser();
document.getElementById("infoBrowser").textContent = browserName;

// ---------- 4. Hệ điều hành ----------
function detectOS() {
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS")) return "macOS";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Linux")) return "Linux";
    return "Không xác định";
}
const osName = detectOS();
document.getElementById("infoOS").textContent = osName;

// ---------- 5. Danh sách ngôn ngữ ----------
const langs = navigator.languages ? navigator.languages.join(", ") : navigator.language;
document.getElementById("infoLangs").textContent = langs;

// ---------- 6. Kích thước màn hình ----------
const screenSize = `${screen.width} x ${screen.height} px`;
document.getElementById("infoScreen").textContent = screenSize;

// ---------- 7. Hướng màn hình ----------
function getOrientation() {
    if (screen.orientation && screen.orientation.type) return screen.orientation.type;
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}
document.getElementById("infoOrientation").textContent = getOrientation();

// ---------- Banner quảng cáo ----------
const adBanner = document.getElementById("adBanner");
adBanner.href = `campaign.html?utm_source=${encodeURIComponent(MY_NAME)}&utm_campaign=campage_1`;

// ==========================================================
// ================ FINGERPRINTING (SPA) ===================
// ==========================================================

function collectBomData() {
    return {
        location: elLocation.textContent,
        online: navigator.onLine ? "Online" : "Offline",
        browser: browserName,
        os: osName,
        languages: langs,
        screenSize: screenSize,
        orientation: getOrientation(),
        timestamp: new Date().toLocaleString("vi-VN"),
    };
}

function buildFingerprintString(data) {
    // Nối chuỗi thủ công bằng toán tử +
    return (
        "location=" +
        data.location +
        "|online=" +
        data.online +
        "|browser=" +
        data.browser +
        "|os=" +
        data.os +
        "|languages=" +
        data.languages +
        "|screen=" +
        data.screenSize +
        "|orientation=" +
        data.orientation +
        "|time=" +
        data.timestamp
    );
}

function showHome() {
    viewFingerprint.classList.add("hidden");
    viewHome.classList.remove("hidden");
}

function showFingerprint(data) {
    viewHome.classList.add("hidden");
    viewFingerprint.classList.remove("hidden");
    document.getElementById("fingerprintString").textContent = buildFingerprintString(data);
    document.getElementById("fingerprintRaw").textContent = JSON.stringify(data, null, 2);
}

// Thiết lập state ban đầu cho trang chủ (để popstate về được đúng chỗ)
history.replaceState({ view: "home" }, "", "index.html");

document.getElementById("btnFingerprint").addEventListener("click", () => {
    const data = collectBomData();
    const state = { view: "fingerprint", data: data };
    history.pushState(state, "Fingerprinting", "fingerprint.html");
    showFingerprint(data);
});

document.getElementById("btnHome").addEventListener("click", () => {
    if (viewFingerprint.classList.contains("hidden")) return; // đã ở home
    history.pushState({ view: "home" }, "Trang chủ", "index.html");
    showHome();
});

document.getElementById("btnBack").addEventListener("click", () => {
    history.back();
});

// Lắng nghe Back/Forward của trình duyệt
window.addEventListener("popstate", (event) => {
    const state = event.state;
    if (state && state.view === "fingerprint") {
        showFingerprint(state.data);
    } else {
        showHome();
    }
});
