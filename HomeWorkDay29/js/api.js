const API_BASE = "https://spotify.f8team.dev";

const STORAGE_KEYS = {
    accessToken: "sp_access_token",
    refreshToken: "sp_refresh_token",
    user: "sp_user",
};

// ---------------------- Token / user storage ----------------------

function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
}
function getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
}
function getStoredUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
function setAccessToken(token) {
    if (token) localStorage.setItem(STORAGE_KEYS.accessToken, token);
}
function setRefreshToken(token) {
    if (token) localStorage.setItem(STORAGE_KEYS.refreshToken, token);
}
function setStoredUser(user) {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}
function clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
}
function isLoggedIn() {
    return !!getAccessToken();
}

// ---------------------- Chuẩn hoá response ----------------------

function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
}

/** Trích accessToken / refreshToken / user từ response đăng ký hoặc đăng nhập */
function normalizeAuthResponse(json) {
    const d = pick(json, ["data"]) || json || {};
    const tokenBag = pick(d, ["tokens", "token"]) && typeof pick(d, ["tokens"]) === "object" ? pick(d, ["tokens"]) : d;

    const accessToken =
        pick(tokenBag, ["access_token", "accessToken", "token"]) || pick(d, ["access_token", "accessToken", "token"]);
    const refreshToken =
        pick(tokenBag, ["refresh_token", "refreshToken"]) || pick(d, ["refresh_token", "refreshToken"]);
    const user = pick(d, ["user", "profile", "account"]) || null;

    return { accessToken, refreshToken, user };
}

/** Trích mảng item + tổng số từ response danh sách (artists/albums/tracks/...) */
function normalizeList(json, arrKey) {
    const list = pick(json, [arrKey, "data", "items", "results"]) || (Array.isArray(json) ? json : []);
    const total = pick(json, ["total", "count", "totalCount"]) ?? (Array.isArray(list) ? list.length : 0);
    return { list: Array.isArray(list) ? list : [], total };
}

function flattenMessage(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    if (Array.isArray(value)) {
        return value
            .map((v) => flattenMessage(v))
            .filter(Boolean)
            .join(", ");
    }

    if (typeof value === "object") {
        if (value.message) return flattenMessage(value.message);
        if (value.msg) return flattenMessage(value.msg);
        // object dạng { field: "lỗi", field2: "lỗi2" } -> "field: lỗi, field2: lỗi2"
        return Object.entries(value)
            .map(([key, v]) => `${key}: ${flattenMessage(v)}`)
            .filter(Boolean)
            .join("; ");
    }

    return null;
}

/** Trích thông báo lỗi dễ đọc từ response lỗi của API */
function extractErrorMessage(json, fallback) {
    // Log nguyên response lỗi ra console để tiện debug khi cần
    if (json) console.error("API error response:", json);

    // Ưu tiên chi tiết lỗi cụ thể (thường nằm ở "errors"), vì "message" cấp cao
    // nhiều khi chỉ ghi chung chung kiểu "Validation failed".
    const detail = flattenMessage(pick(json, ["errors", "error_details", "details"]));
    const general = flattenMessage(pick(json, ["message", "error", "detail"]));

    // Nếu detail có nội dung và khác với general (tránh lặp lại y hệt), ưu tiên detail.
    if (detail && detail !== general) {
        return general && general.toLowerCase() !== detail.toLowerCase() ? `${general}: ${detail}` : detail;
    }

    return general || fallback;
}

// ---------------------- Gọi API tập trung ----------------------

/**
 * apiFetch: hàm fetch dùng chung cho cả app.
 * @param {string} path - đường dẫn API, vd: "/api/artists?limit=20"
 * @param {object} options - { method, body, auth }
 *    - body: object thường (sẽ tự JSON.stringify)
 *    - auth: mặc định true -> tự gắn Authorization Bearer token
 */
async function apiFetch(path, options = {}) {
    return _apiFetchInternal(path, options, true);
}

async function _apiFetchInternal(path, options = {}, allowRetryOn401 = true) {
    const { method = "GET", body, auth = true, headers = {} } = options;

    const finalHeaders = { "Content-Type": "application/json", ...headers };
    if (auth) {
        const token = getAccessToken();
        if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
    }

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: finalHeaders,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        throw new Error("Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    }

    // Xử lý 401: thử refresh token rồi gọi lại request 1 lần
    if (res.status === 401 && auth && allowRetryOn401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            return _apiFetchInternal(path, options, false);
        }
        clearAuth();
        if (!location.pathname.endsWith("login.html")) {
            location.href = "login.html?message=session_expired";
        }
        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    let json = null;
    const text = await res.text();
    if (text) {
        try {
            json = JSON.parse(text);
        } catch {
            json = null;
        }
    }

    if (!res.ok) {
        throw new Error(extractErrorMessage(json, `Yêu cầu thất bại (mã ${res.status}).`));
    }

    return json;
}

/** Gọi /api/auth/refresh-token, cập nhật lại access token nếu thành công */
async function tryRefreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken, refreshToken: refreshToken }),
        });
        if (!res.ok) return false;

        const json = await res.json();
        const { accessToken, refreshToken: newRefreshToken } = normalizeAuthResponse(json);

        if (!accessToken) return false;
        setAccessToken(accessToken);
        if (newRefreshToken) setRefreshToken(newRefreshToken);
        return true;
    } catch {
        return false;
    }
}

/** Đăng xuất: xoá thông tin đã lưu và điều hướng về trang đăng nhập */
function logout() {
    clearAuth();
    location.href = "login.html";
}
