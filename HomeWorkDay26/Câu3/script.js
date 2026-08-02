const imgs = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200",
    "https://images.unsplash.com/photo-1511497584788-876760111969?w=1200",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200",
];

const track = document.querySelector(".track"),
    dots = document.querySelector(".dots"),
    counter = document.querySelector(".counter"),
    slider = document.querySelector(".slider");
const arr = [imgs.at(-1), ...imgs, imgs[0]];
arr.forEach((s) => {
    track.innerHTML += `<div class='slide'><img src='${s}'></div>`;
});
imgs.forEach((_, i) => (dots.innerHTML += `<div class='dot' data-i='${i}'></div>`));
let i = 1,
    t;
function draw(a = true) {
    track.style.transition = a ? "transform .5s" : "none";
    track.style.transform = `translateX(-${i * 100}%)`;
    let r = i - 1;
    if (r < 0) r = imgs.length - 1;
    if (r >= imgs.length) r = 0;
    document.querySelectorAll(".dot").forEach((d, k) => d.classList.toggle("active", k === r));
    counter.textContent = `${r + 1} / ${imgs.length}`;
}
draw(false);
function next() {
    i++;
    draw();
}
function prev() {
    i--;
    draw();
}
function reset() {
    clearInterval(t);
    t = setInterval(next, 3000);
}
document.querySelector(".next").onclick = () => {
    next();
    reset();
};
document.querySelector(".prev").onclick = () => {
    prev();
    reset();
};
dots.onclick = (e) => {
    if (!e.target.classList.contains("dot")) return;
    i = +e.target.dataset.i + 1;
    draw();
    reset();
};
track.ontransitionend = () => {
    if (i === arr.length - 1) {
        i = 1;
        draw(false);
    }
    if (i === 0) {
        i = imgs.length;
        draw(false);
    }
};
slider.onmouseenter = () => clearInterval(t);
slider.onmouseleave = reset;
function key(e) {
    if (e.key === "ArrowRight") {
        next();
        reset();
    }
    if (e.key === "ArrowLeft") {
        prev();
        reset();
    }
}
slider.addEventListener("focusin", () => document.addEventListener("keydown", key));
slider.addEventListener("focusout", (e) => {
    if (!slider.contains(e.relatedTarget)) document.removeEventListener("keydown", key);
});
reset();
