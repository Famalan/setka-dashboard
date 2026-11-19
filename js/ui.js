"use strict";
const UI = (() => {
  const shapes = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    note: '<path d="M5 3h14v13l-5 5H5zM14 21v-6h5M8 8h8m-8 4h6"/>',
    tasks:
      '<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m4 17 2 2 4-5m3-6h8m-8 9h8"/>',
    counter: '<path d="m10 3-4 18m12-18-4 18M4 9h17M3 15h17"/>',
    chart: '<path d="M4 4v16h17M8 16v-4m5 4V6m5 10V9"/>',
    grip: '<path stroke-width="3.5" stroke-linecap="round" d="M9 6h0m6 0h0m-6 6h0m6 0h0m-6 6h0m6 0h0"/>',
    edit: '<path d="m4 15 11-11 5 5L9 20l-6 1zM13 6l5 5"/>',
    collapse: '<path d="m6 14 6-6 6 6"/>',
    expand: '<path d="m6 10 6 6 6-6"/>',
    remove: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
    reset: '<path d="M3 4v6h6M4 10a8 8 0 1 1 1 8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
  };
  function icon(key) {
    return (
      '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      shapes[key] +
      "</svg>"
    );
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(key, label, fn, visible = false) {
    const b = el("button", "icon");
    b.type = "button";
    b.title = label;
    b.setAttribute("aria-label", label);
    b.innerHTML = icon(key);
    if (visible) b.append(label);
    b.onclick = fn;
    return b;
  }
  const dialog = document.querySelector("#dialog"),
    content = document.querySelector("#dialog-content");
  function modal(title, build) {
    document.querySelector("#dialog-title").textContent = title;
    content.replaceChildren();
    build(content);
    dialog.showModal();
    document.body.classList.add("locked");
    (
      content.querySelector("[data-focus]") || document.querySelector("#close")
    ).focus();
  }
  const close = () => dialog.close();
  document.querySelector("#close").onclick = close;
  dialog.onclose = () => document.body.classList.remove("locked");
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        close();
    }
  };
  dialog.onkeydown = (e) => {
    if (e.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll("button,input,textarea,select"),
    ].filter((n) => !n.disabled && n.offsetWidth);
    const first = controls[0],
      last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  let timer;
  function toast(msg) {
    const box = document.querySelector("#toast");
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => box.classList.remove("show"), 3000);
  }
  return { icon, el, button, modal, close, toast };
})();
