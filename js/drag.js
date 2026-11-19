"use strict";
function enableSorting(grid, move) {
  let source, target;
  function clear() {
    source?.classList.remove("dragging");
    target?.classList.remove("target");
    source = null;
    target = null;
  }
  function begin(handle) {
    source = handle.closest("article");
    source.classList.add("dragging");
  }
  function over(card) {
    target?.classList.remove("target");
    target = card !== source ? card : null;
    target?.classList.add("target");
  }
  function finish() {
    const from = source?.dataset.id,
      to = target?.dataset.id;
    clear();
    if (from && to) move(from, to);
  }
  grid.addEventListener("dragstart", (e) => {
    const handle = e.target.closest(".handle");
    if (!handle) return;
    begin(handle);
    e.dataTransfer.setData("text/plain", source.dataset.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(source, 24, 24);
  });
  grid.addEventListener("dragover", (e) => {
    if (source) {
      e.preventDefault();
      over(e.target.closest("article"));
    }
  });
  grid.addEventListener("drop", (e) => {
    if (source) {
      e.preventDefault();
      over(e.target.closest("article"));
      finish();
    }
  });
  grid.addEventListener("dragend", clear);
  grid.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".handle");
    if (!handle || e.pointerType === "mouse") return;
    handle.setPointerCapture(e.pointerId);
    begin(handle);
  });
  grid.addEventListener("pointermove", (e) => {
    if (source && e.pointerType !== "mouse")
      over(document.elementFromPoint(e.clientX, e.clientY)?.closest("article"));
  });
  grid.addEventListener("pointerup", (e) => {
    if (source && e.pointerType !== "mouse") finish();
  });
  grid.addEventListener("pointercancel", (e) => {
    if (e.pointerType !== "mouse") clear();
  });
  grid.addEventListener("keydown", (e) => {
    if (!e.target.closest(".handle")) return;
    const dirs = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    if (!(e.key in dirs)) return;
    e.preventDefault();
    const cards = [...grid.querySelectorAll("article")],
      card = e.target.closest("article"),
      other = cards[cards.indexOf(card) + dirs[e.key]];
    if (other) {
      move(card.dataset.id, other.dataset.id);
      card.querySelector(".handle").focus();
    }
  });
}
