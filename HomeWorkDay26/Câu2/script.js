const tabs = document.querySelector(".tabs");

const tabBtns = document.querySelectorAll(".tab-btn");

const contents = document.querySelectorAll(".content");

let currentIndex = 0;

function showTab(index) {
    tabBtns.forEach(function (btn) {
        btn.classList.remove("active");
    });

    contents.forEach(function (content) {
        content.classList.remove("active");
    });

    tabBtns[index].classList.add("active");

    contents[index].classList.add("active");

    currentIndex = index;
}

tabBtns.forEach(function (btn, index) {
    btn.addEventListener("click", function () {
        showTab(index);
    });
});

function handleKeyDown(e) {
    if (e.key === "ArrowRight") {
        currentIndex++;

        if (currentIndex >= tabBtns.length) {
            currentIndex = 0;
        }

        showTab(currentIndex);
    }

    if (e.key === "ArrowLeft") {
        currentIndex--;

        if (currentIndex < 0) {
            currentIndex = tabBtns.length - 1;
        }

        showTab(currentIndex);
    }
}

tabs.addEventListener("focusin", function () {
    document.addEventListener("keydown", handleKeyDown);
});

tabs.addEventListener("focusout", function (e) {
    if (!tabs.contains(e.relatedTarget)) {
        document.removeEventListener("keydown", handleKeyDown);
    }
});
