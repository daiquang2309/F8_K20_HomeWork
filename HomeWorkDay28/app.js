const API_BASE = "https://dummyjson.com";
const LIMIT = 12;

// ----- State -----
let state = {
    skip: 0,
    limit: LIMIT,
    query: "",
    category: "",
    sortBy: "",
    order: "",
    total: 0,
};

// ----- DOM refs -----
const productGrid = document.getElementById("productGrid");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const emptyState = document.getElementById("emptyState");
const paginationBar = document.getElementById("paginationBar");
const pageInfo = document.getElementById("pageInfo");
const pageNumber = document.getElementById("pageNumber");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");

// ----- Helpers -----
function showState({ loading = false, error = null, empty = false } = {}) {
    loadingState.classList.toggle("hidden", !loading);
    loadingState.classList.toggle("flex", loading);
    errorState.classList.toggle("hidden", !error);
    if (error) errorMessage.textContent = error;
    emptyState.classList.toggle("hidden", !empty);
}

function formatMoney(n) {
    return "$" + Number(n).toFixed(2);
}

function calcSalePrice(price, discountPercentage) {
    const sale = price - (price * discountPercentage) / 100;
    return Math.round(sale * 100) / 100;
}

function renderStars(rating) {
    const full = Math.round(rating);
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += i <= full ? '<span class="text-amber-400">★</span>' : '<span class="text-slate-300">★</span>';
    }
    return html;
}

function stockBadge(stock) {
    if (stock <= 0)
        return `<span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Hết hàng</span>`;
    if (stock < 10)
        return `<span class="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Sắp hết: ${stock}</span>`;
    return `<span class="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Còn hàng: ${stock}</span>`;
}

// ----- Build API URL based on state -----
function buildUrl() {
    const params = new URLSearchParams();
    params.set("limit", state.limit);
    params.set("skip", state.skip);
    if (state.sortBy) {
        params.set("sortBy", state.sortBy);
        params.set("order", state.order);
    }

    if (state.query) {
        return `${API_BASE}/products/search?q=${encodeURIComponent(state.query)}&${params.toString()}`;
    }
    if (state.category) {
        return `${API_BASE}/products/category/${encodeURIComponent(state.category)}?${params.toString()}`;
    }
    return `${API_BASE}/products?${params.toString()}`;
}

// ----- Render product cards -----
function renderProducts(products) {
    productGrid.innerHTML = products
        .map((p) => {
            const salePrice = calcSalePrice(p.price, p.discountPercentage);
            const hasDiscount = p.discountPercentage > 0;
            return `
      <a href="product.html?id=${p.id}" class="product-card bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div class="relative">
          <img src="${p.thumbnail}" alt="${p.title}" class="w-full h-44 object-cover" loading="lazy">
          ${hasDiscount ? `<span class="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full">-${p.discountPercentage.toFixed(0)}%</span>` : ""}
        </div>
        <div class="p-4 flex flex-col flex-1">
          <h3 class="font-semibold text-slate-800 mb-1 line-clamp-2">${p.title}</h3>
          <div class="text-sm mb-2">${renderStars(p.rating)} <span class="text-slate-400 ml-1">(${p.rating.toFixed(2)})</span></div>

          <div class="flex items-baseline gap-2 mb-2">
            <span class="text-lg font-bold text-indigo-700">${formatMoney(salePrice)}</span>
            ${hasDiscount ? `<span class="text-sm text-slate-400 line-through">${formatMoney(p.price)}</span>` : ""}
          </div>

          <div class="mt-auto flex items-center justify-between">
            ${stockBadge(p.stock)}
            <span class="text-indigo-600 text-sm font-medium">Chi tiết →</span>
          </div>
        </div>
      </a>
    `;
        })
        .join("");
}

function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    const currentPage = Math.floor(state.skip / state.limit) + 1;

    pageInfo.textContent = `Hiển thị ${Math.min(state.skip + 1, state.total)}–${Math.min(state.skip + state.limit, state.total)} trong tổng số ${state.total} sản phẩm`;
    pageNumber.textContent = `Trang ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    paginationBar.classList.remove("hidden");
}

// ----- Main fetch -----
async function loadProducts() {
    showState({ loading: true });
    paginationBar.classList.add("hidden");
    productGrid.innerHTML = "";

    try {
        const res = await fetch(buildUrl());
        if (!res.ok) {
            throw new Error(`Lỗi máy chủ (mã ${res.status})`);
        }
        const data = await res.json();
        const products = data.products || [];
        state.total = data.total || 0;

        if (products.length === 0) {
            showState({ empty: true });
            return;
        }

        showState({});
        renderProducts(products);
        renderPagination();
    } catch (err) {
        showState({ error: err.message || "Không thể kết nối tới API." });
    }
}

// ----- Load category list -----
async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/products/categories`);
        if (!res.ok) throw new Error("Không tải được danh mục");
        const categories = await res.json();
        categorySelect.innerHTML =
            `<option value="">Tất cả danh mục</option>` +
            categories.map((c) => `<option value="${c.slug}">${c.name}</option>`).join("");
    } catch (err) {
        // Không chặn trang chính nếu lỗi tải danh mục
        console.error(err);
    }
}

// ----- Debounce search -----
let searchTimer = null;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.query = searchInput.value.trim();
        state.skip = 0;
        // Search và filter category không dùng đồng thời trên dummyjson -> reset category khi search
        if (state.query) {
            state.category = "";
            categorySelect.value = "";
        }
        loadProducts();
    }, 400);
});

categorySelect.addEventListener("change", () => {
    state.category = categorySelect.value;
    state.skip = 0;
    if (state.category) {
        state.query = "";
        searchInput.value = "";
    }
    loadProducts();
});

sortSelect.addEventListener("change", () => {
    const val = sortSelect.value;
    if (!val) {
        state.sortBy = "";
        state.order = "";
    } else {
        const [field, order] = val.split("-");
        state.sortBy = field;
        state.order = order;
    }
    state.skip = 0;
    loadProducts();
});

prevBtn.addEventListener("click", () => {
    state.skip = Math.max(0, state.skip - state.limit);
    loadProducts();
});

nextBtn.addEventListener("click", () => {
    if (state.skip + state.limit < state.total) {
        state.skip += state.limit;
        loadProducts();
    }
});

// ----- Init -----
loadCategories();
loadProducts();
