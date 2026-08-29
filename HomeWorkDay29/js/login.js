// Nếu đã đăng nhập rồi thì điều hướng thẳng về trang chủ
if (isLoggedIn()) {
    location.href = "index.html";
}

const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");
const apiError = document.getElementById("apiError");
const noticeBanner = document.getElementById("noticeBanner");

// Hiển thị thông báo dựa trên query string (?message=...)
(function showNoticeFromQuery() {
    const msg = new URLSearchParams(location.search).get("message");
    const messages = {
        registered: "Đăng ký thành công! Vui lòng đăng nhập.",
        session_expired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        logged_out: "Bạn đã đăng xuất.",
    };
    if (msg && messages[msg]) {
        noticeBanner.textContent = messages[msg];
        noticeBanner.classList.remove("hidden");
    }
})();

function showFieldError(field, message) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    const input = document.getElementById(field);
    if (message) {
        el.textContent = message;
        el.classList.remove("hidden");
        input.style.borderColor = "#f15e6c";
    } else {
        el.classList.add("hidden");
        input.style.borderColor = "";
    }
}

function validate(values) {
    let ok = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.email.trim()) {
        showFieldError("email", "Vui lòng nhập email.");
        ok = false;
    } else if (!emailRegex.test(values.email.trim())) {
        showFieldError("email", "Email không hợp lệ.");
        ok = false;
    } else {
        showFieldError("email", null);
    }

    if (!values.password) {
        showFieldError("password", "Vui lòng nhập mật khẩu.");
        ok = false;
    } else {
        showFieldError("password", null);
    }

    return ok;
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Đang đăng nhập..." : "Đăng nhập";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    apiError.classList.add("hidden");

    const values = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
    };

    if (!validate(values)) return;

    setLoading(true);
    try {
        const json = await apiFetch("/api/auth/login", {
            method: "POST",
            auth: false,
            body: { email: values.email.trim(), password: values.password },
        });

        const { accessToken, refreshToken, user } = normalizeAuthResponse(json);

        if (!accessToken) {
            throw new Error("Đăng nhập thất bại: máy chủ không trả về access token.");
        }

        setAccessToken(accessToken);
        if (refreshToken) setRefreshToken(refreshToken);
        if (user) setStoredUser(user);

        location.href = "index.html";
    } catch (err) {
        apiError.textContent = err.message || "Email hoặc mật khẩu không đúng.";
        apiError.classList.remove("hidden");
    } finally {
        setLoading(false);
    }
});
