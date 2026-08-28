const API_BASE = "https://dummyjson.com";

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const productDetail = document.getElementById("productDetail");

function showLoading() {
    loadingState.classList.remove("hidden");
    loadingState.classList.add("flex");
    errorState.classList.add("hidden");
    productDetail.classList.add("hidden");
}

function showError(msg) {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    errorMessage.textContent = msg;
    productDetail.classList.add("hidden");
}

function showDetail() {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    productDetail.classList.remove("hidden");
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

function stockInfo(stock) {
    if (stock <= 0) return { text: `Hết hàng`, cls: "bg-red-50 text-red-600" };
    if (stock < 10) return { text: `Sắp hết hàng — còn ${stock}`, cls: "bg-orange-50 text-orange-600" };
    return { text: `Còn hàng — ${stock} sản phẩm`, cls: "bg-green-50 text-green-600" };
}

function renderReviews(reviews) {
    const list = document.getElementById("reviewList");
    if (!reviews || reviews.length === 0) {
        list.innerHTML = `<p class="text-slate-400 text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>`;
        return;
    }
    list.innerHTML = reviews
        .map(
            (r) => `
    <div class="border-b border-slate-100 pb-4 last:border-0">
      <div class="flex items-center justify-between mb-1">
        <p class="font-semibold text-sm">${r.reviewerName}</p>
        <span class="text-xs text-slate-400">${new Date(r.date).toLocaleDateString("vi-VN")}</span>
      </div>
      <div class="text-sm mb-1">${renderStars(r.rating)}</div>
      <p class="text-slate-600 text-sm">${r.comment}</p>
    </div>
  `,
        )
        .join("");
}

function renderThumbnails(images, mainImageEl) {
    const thumbList = document.getElementById("thumbList");
    thumbList.innerHTML = images
        .map(
            (img, i) => `
    <img src="${img}" data-src="${img}"
         class="thumb w-16 h-16 object-cover rounded-lg border-2 ${i === 0 ? "active border-indigo-600" : "border-transparent"}">
  `,
        )
        .join("");

    thumbList.querySelectorAll(".thumb").forEach((thumb) => {
        thumb.addEventListener("click", () => {
            mainImageEl.src = thumb.dataset.src;
            thumbList.querySelectorAll(".thumb").forEach((t) => t.classList.remove("active", "border-indigo-600"));
            thumb.classList.add("active", "border-indigo-600");
        });
    });
}

function renderProduct(p) {
    document.getElementById("detailCategory").textContent = p.category;
    document.getElementById("detailTitle").textContent = p.title;
    document.getElementById("detailBrand").textContent = p.brand ? `Thương hiệu: ${p.brand}` : "Không rõ thương hiệu";

    document.getElementById("detailStars").innerHTML = renderStars(p.rating);
    document.getElementById("detailRating").textContent = `(${p.rating.toFixed(2)} / 5)`;

    const salePrice = calcSalePrice(p.price, p.discountPercentage);
    document.getElementById("detailSalePrice").textContent = formatMoney(salePrice);

    if (p.discountPercentage > 0) {
        document.getElementById("detailPrice").textContent = formatMoney(p.price);
        document.getElementById("detailDiscount").textContent = `-${p.discountPercentage.toFixed(0)}%`;
    } else {
        document.getElementById("detailPrice").textContent = "";
        document.getElementById("detailDiscount").textContent = "";
    }

    const stock = stockInfo(p.stock);
    const stockEl = document.getElementById("detailStock");
    stockEl.textContent = stock.text;
    stockEl.className = `inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4 ${stock.cls}`;

    document.getElementById("detailDescription").textContent = p.description;
    document.getElementById("detailSku").textContent = p.sku || "-";
    document.getElementById("detailWeight").textContent = p.weight ? `${p.weight} g` : "-";

    const d = p.dimensions || {};
    document.getElementById("detailDimensions").textContent =
        d.width && d.height && d.depth ? `${d.width} x ${d.height} x ${d.depth} cm` : "-";

    document.getElementById("detailTags").textContent = p.tags && p.tags.length ? p.tags.join(", ") : "-";

    const mainImage = document.getElementById("mainImage");
    const images = p.images && p.images.length ? p.images : [p.thumbnail];
    mainImage.src = images[0];
    mainImage.alt = p.title;
    renderThumbnails(images, mainImage);

    renderReviews(p.reviews);

    document.title = `${p.title} - Chi tiết sản phẩm`;
}

async function loadProductDetail() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id || isNaN(Number(id))) {
        showError("Không tìm thấy ID sản phẩm hợp lệ trong đường dẫn.");
        return;
    }

    showLoading();

    try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (res.status === 404) {
            showError(`Sản phẩm với ID "${id}" không tồn tại.`);
            return;
        }
        if (!res.ok) {
            throw new Error(`Lỗi máy chủ (mã ${res.status})`);
        }
        const product = await res.json();
        if (!product || !product.id) {
            showError("Không tìm thấy dữ liệu sản phẩm.");
            return;
        }
        renderProduct(product);
        showDetail();
    } catch (err) {
        showError(err.message || "Không thể kết nối tới API.");
    }
}

loadProductDetail();
