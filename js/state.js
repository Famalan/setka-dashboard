"use strict";
const Store = (() => {
  const key = "setka.dashboard";
  const kinds = {
    note: "Заметка",
    counter: "Счётчик",
    tasks: "Список задач",
    chart: "График",
  };
  const uid = () =>
    crypto.randomUUID?.() ||
    Date.now().toString(36) + Math.random().toString(36).slice(2);
  function widget(type, title) {
    const defaults = {
      note: { text: "" },
      counter: { value: 0, step: 1 },
      tasks: { items: [] },
      chart: { values: [4, 7, 5, 9, 6, 3, 5], status: "loading" },
    };
    return { id: uid(), type, title, collapsed: false, ...defaults[type] };
  }
  function sample() {
    const note = widget("note", "Фокус на неделю");
    note.text =
      "Собрать идеи для нового проекта и выбрать одну, которую хочется довести до результата.\n\nНачать с малого — уже план.";
    const tasks = widget("tasks", "Планы на сегодня");
    tasks.items = [
      "Разобрать входящие",
      "Собрать референсы",
      "Обновить дашборд",
    ].map((text, i) => ({ id: uid(), text, done: i === 0 }));
    const counter = widget("counter", "Фокус-сессии");
    counter.value = 12;
    const chart = widget("chart", "Активность за неделю");
    chart.status = "ready";
    return [note, tasks, counter, chart];
  }
  function valid(w) {
    if (
      !w ||
      typeof w.id !== "string" ||
      !w.id ||
      typeof w.title !== "string" ||
      !w.title.trim() ||
      typeof w.collapsed !== "boolean"
    )
      return false;
    switch (w.type) {
      case "note":
        return typeof w.text === "string";
      case "counter":
        return (
          Number.isFinite(w.value) && Number.isFinite(w.step) && w.step > 0
        );
      case "chart":
        return (
          ["loading", "ready", "error"].includes(w.status) &&
          Array.isArray(w.values) &&
          w.values.length > 0 &&
          w.values.length <= 30 &&
          w.values.every(Number.isFinite)
        );
      case "tasks":
        return (
          Array.isArray(w.items) &&
          w.items.every(
            (t) =>
              t &&
              typeof t.id === "string" &&
              typeof t.text === "string" &&
              typeof t.done === "boolean",
          ) &&
          new Set(w.items.map((t) => t.id)).size === w.items.length
        );
      default:
        return false;
    }
  }
  function load() {
    const empty = { version: 1, theme: "light", widgets: [] };
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return { ...empty, widgets: sample() };
      const data = JSON.parse(raw);
      if (
        data.version === 1 &&
        ["light", "dark"].includes(data.theme) &&
        Array.isArray(data.widgets) &&
        data.widgets.every(valid) &&
        new Set(data.widgets.map((w) => w.id)).size === data.widgets.length
      )
        return data;
    } catch {}
    return empty;
  }
  const state = load();
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }
  return { state, widget, kinds, uid, save };
})();
