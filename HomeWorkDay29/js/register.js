// Nếu đã đăng nhập rồi thì không cho vào lại trang đăng ký
if (isLoggedIn()) {
    location.href = "index.html";
}

const form = document.getElementById("registerForm");
const submitBtn = document.getElementById("submitBtn");
const apiError = document.getElementById("apiError");

const fields = ["username", "email", "password", "display_name", "bio", "country"];

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

    if (!values.username.trim()) {
        showFieldError("username", "Vui lòng nhập tên đăng nhập.");
        ok = false;
    } else {
        showFieldError("username", null);
    }

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

    if (!values.password || values.password.length < 6) {
        showFieldError("password", "Mật khẩu cần ít nhất 6 ký tự.");
        ok = false;
    } else {
        showFieldError("password", null);
    }

    if (!values.display_name.trim()) {
        showFieldError("display_name", "Vui lòng nhập tên hiển thị.");
        ok = false;
    } else {
        showFieldError("display_name", null);
    }

    // Giới thiệu bắt buộc
    if (!values.bio.trim()) {
        showFieldError("bio", "Vui lòng nhập giới thiệu.");
        ok = false;
    } else {
        showFieldError("bio", null);
    }

    // Quốc gia bắt buộc
    if (!values.country.trim()) {
        showFieldError("country", "Vui lòng nhập quốc gia.");
        ok = false;
    } else {
        showFieldError("country", null);
    }

    return ok;
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Đang xử lý..." : "Đăng ký";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    apiError.classList.add("hidden");

    const values = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        display_name: document.getElementById("display_name").value,
        bio: document.getElementById("bio").value,
        country: document.getElementById("country").value,
    };

    if (!validate(values)) return;

    setLoading(true);
    try {
        const json = await apiFetch("/api/auth/register", {
            method: "POST",
            auth: false,
            body: {
                username: values.username.trim(),
                email: values.email.trim(),
                password: values.password,
                display_name: values.display_name.trim(),
                bio: values.bio.trim(),
                country: values.country.trim(),
            },
        });

        const { accessToken, refreshToken, user } = normalizeAuthResponse(json);

        if (accessToken) {
            setAccessToken(accessToken);
            if (refreshToken) setRefreshToken(refreshToken);
            if (user) setStoredUser(user);
            location.href = "index.html";
        } else {
            // Một số API chỉ tạo tài khoản mà không tự đăng nhập luôn -> chuyển sang trang đăng nhập
            location.href = "login.html?message=registered";
        }
    } catch (err) {
        apiError.textContent = err.message || "Đăng ký thất bại. Vui lòng thử lại.";
        apiError.classList.remove("hidden");
    } finally {
        setLoading(false);
    }
});
