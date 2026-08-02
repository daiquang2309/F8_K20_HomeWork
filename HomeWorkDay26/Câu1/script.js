const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const err = document.getElementById("input-error");
const empty = document.getElementById("empty-message");
const count = document.getElementById("todo-count");
const clearBtn = document.getElementById("clear-completed");
let todos = [];
let filter = "all";
let id = 1;
function render() {
    list.innerHTML = "";
    let arr = todos.filter((t) => !t.deleted);
    if (filter === "active") arr = arr.filter((t) => !t.completed);
    if (filter === "completed") arr = arr.filter((t) => t.completed);
    empty.style.display = arr.length ? "none" : "block";
    arr.forEach((t) => {
        const li = document.createElement("li");
        li.className = "todo" + (t.completed ? " completed" : "");
        li.dataset.id = t.id;
        li.innerHTML = `<div><input type="checkbox" class="toggle" ${t.completed ? "checked" : ""}>
<span class="text">${t.text}</span></div>
<button class="delete">Xóa</button>`;
        list.appendChild(li);
    });
    const total = todos.filter((t) => !t.deleted).length;
    const done = todos.filter((t) => !t.deleted && t.completed).length;
    count.textContent = `${done}/${total} mục đã hoàn thành`;
    clearBtn.style.display = done ? "inline-block" : "none";
}
function add() {
    const text = input.value.trim();
    if (!text) {
        err.textContent = "Vui lòng nhập nội dung todo!";
        return;
    }
    err.textContent = "";
    todos.push({ id: id++, text, completed: false, deleted: false });
    input.value = "";
    input.focus();
    render();
}
addBtn.onclick = add;
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") add();
});
document.querySelectorAll(".filter-btn").forEach(
    (b) =>
        (b.onclick = () => {
            document.querySelector(".active").classList.remove("active");
            b.classList.add("active");
            filter = b.dataset.filter;
            render();
        }),
);
list.addEventListener("change", (e) => {
    if (e.target.classList.contains("toggle")) {
        const t = todos.find((x) => x.id == e.target.closest(".todo").dataset.id);
        t.completed = e.target.checked;
        render();
    }
});
list.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete")) {
        const li = e.target.closest(".todo");
        if (confirm("Xóa todo này?")) {
            const t = todos.find((x) => x.id == li.dataset.id);
            t.deleted = true;
            li.classList.add("hide");
            setTimeout(render, 250);
        }
    }
});
list.addEventListener("dblclick", (e) => {
    if (!e.target.classList.contains("text")) return;
    const span = e.target,
        li = span.closest(".todo");
    const t = todos.find((x) => x.id == li.dataset.id);
    const old = t.text;
    span.outerHTML = `<div><input class="edit" value="${old}"><div class="error small"></div></div>`;
    const edit = li.querySelector(".edit");
    const er = li.querySelector(".small");
    edit.focus();
    edit.select();
    function save() {
        const v = edit.value.trim();
        if (!v) {
            er.textContent = "Vui lòng nhập nội dung todo!";
            return;
        }
        t.text = v;
        render();
    }
    edit.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") save();
        if (ev.key === "Escape") {
            t.text = old;
            render();
        }
    });
    edit.addEventListener("blur", save);
});
clearBtn.onclick = () => {
    if (!confirm("Xóa tất cả todo đã hoàn thành?")) return;
    todos.forEach((t) => {
        if (t.completed) t.deleted = true;
    });
    render();
};
render();
