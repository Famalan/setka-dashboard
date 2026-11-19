"use strict";
(() => {
  const { state, kinds } = Store,
    { el, icon, button, modal, close, toast } = UI;
  const grid = document.querySelector("#grid"),
    add = document.querySelector("#add"),
    reset = document.querySelector("#reset"),
    theme = document.querySelector("#theme");
  const cards = new Map();
  function persist() {
    if (!Store.save()) toast("Браузеру не удалось сохранить изменения");
  }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const dark = state.theme === "dark";
    theme.innerHTML =
      icon(dark ? "moon" : "sun") + (dark ? "Тёмная тема" : "Светлая тема");
    theme.setAttribute("aria-label", "Тёмная тема");
    theme.setAttribute("aria-pressed", String(dark));
  }
  theme.onclick = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    persist();
  };
  function field(form, name, label, value, long = false) {
    const wrap = el("label", "field", label),
      input = el(long ? "textarea" : "input");
    input.name = name;
    input.value = value;
    wrap.append(input);
    form.append(wrap);
    return input;
  }
  function editor(w = null) {
    modal(w ? "Настроить виджет" : "Добавить виджет", (box) => {
      const form = el("form");
      form.noValidate = true;
      box.append(form);
      let type = w?.type || "note";
      if (!w) {
        const choices = el("fieldset", "choices");
        choices.append(el("legend", "", "Тип виджета"));
        Object.entries(kinds).forEach(([key, label]) => {
          const item = el("label", "choice " + key),
            radio = el("input");
          radio.type = "radio";
          radio.name = "type";
          radio.value = key;
          radio.checked = key === type;
          radio.onchange = () => {
            type = key;
            details();
          };
          item.append(radio);
          const span = el("span");
          span.innerHTML = icon(key);
          span.append(label);
          item.append(span);
          choices.append(item);
        });
        form.append(choices);
      }
      const title = field(form, "title", "Заголовок", w?.title || "");
      title.placeholder = "Название виджета";
      title.dataset.focus = "";
      const group = el("div");
      form.append(group);
      const err = el("p", "error");
      err.id = "field-error";
      err.setAttribute("role", "alert");
      function details() {
        group.replaceChildren();
        err.textContent = "";
        if (type === "note")
          field(group, "body", "Текст заметки", w?.text || "", true);
        if (type === "counter") {
          field(group, "value", "Значение", w?.value ?? 0);
          field(group, "step", "Шаг счётчика", w?.step ?? 1);
        }
        if (type === "chart")
          field(
            group,
            "values",
            "Значения через пробел",
            w?.values.join(" ") || "4 7 5 9 6 3 5",
          );
      }
      details();
      const submit = el(
        "button",
        "primary",
        w ? "Сохранить" : "Добавить виджет",
      );
      form.append(err, submit);
      function invalid(input, msg) {
        err.textContent = msg;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", err.id);
        input.focus();
      }
      form.oninput = (e) => {
        e.target.removeAttribute("aria-invalid");
        err.textContent = "";
      };
      form.onsubmit = (e) => {
        e.preventDefault();
        const f = form.elements,
          name = title.value.trim();
        if (!name) return invalid(title, "Введите заголовок виджета.");
        const data = { title: name };
        if (type === "note") data.text = f.body.value;
        if (type === "counter") {
          for (const key of ["value", "step"]) {
            const n = Number(f[key].value.trim().replace(",", "."));
            if (
              !f[key].value.trim() ||
              !Number.isFinite(n) ||
              (key === "step" && n <= 0)
            )
              return invalid(
                f[key],
                key === "step"
                  ? "Введите положительный шаг."
                  : "Введите число.",
              );
            data[key] = n;
          }
        }
        if (type === "chart") {
          const raw = f.values.value.trim();
          data.values = raw
            .split(/\s+/)
            .map((v) => Number(v.replace(",", ".")));
          if (
            !raw ||
            data.values.length > 30 ||
            !data.values.every(Number.isFinite)
          )
            return invalid(f.values, "Введите от 1 до 30 чисел через пробел.");
        }
        const item = Object.assign(w || Store.widget(type, name), data);
        close();
        if (!w) {
          state.widgets.push(item);
          mount(item);
          summary();
        } else refresh(item);
        toast(w ? "Изменения сохранены" : "Виджет добавлен");
        persist();
        cards.get(item.id).querySelector(".edit").focus();
        if (!w && type === "chart") loadChart(item);
      };
    });
  }
  function confirmAction(title, msg, verb, action) {
    modal(title, (box) => {
      box.append(el("p", "confirm-text", msg));
      const row = el("div", "confirm-actions"),
        cancel = el("button", "", "Отмена"),
        yes = el("button", "danger", verb);
      cancel.dataset.focus = "";
      cancel.onclick = close;
      yes.onclick = () => {
        close();
        action();
      };
      row.append(cancel, yes);
      box.append(row);
    });
  }
  add.innerHTML = icon("plus") + "Добавить виджет";
  add.onclick = () => editor();
  reset.innerHTML = icon("reset") + "Сбросить дашборд";
  reset.onclick = () =>
    confirmAction(
      "Сбросить дашборд?",
      "Все виджеты и их данные будут удалены.",
      "Сбросить",
      () => {
        state.widgets = [];
        cards.forEach((card) => card.remove());
        cards.clear();
        summary();
        add.focus();
        toast("Сброс выполнен");
        persist();
      },
    );
  const tile = el("button", "tile");
  tile.onclick = () => editor();
  grid.append(tile);
  function summary() {
    document.querySelector("#count").value = state.widgets.length;
    reset.disabled = !state.widgets.length;
    tile.innerHTML =
      "<span>" +
      icon("plus") +
      "</span>" +
      (state.widgets.length ? "Добавить виджет" : "Добавить первый виджет");
  }
  function tasksBody(w, body) {
    const list = el("ul", "tasklist");
    body.append(list);
    function update() {
      list.replaceChildren();
      for (const t of w.items) {
        const li = el("li"),
          label = el("label"),
          check = el("input");
        check.type = "checkbox";
        check.checked = t.done;
        check.onchange = () => {
          t.done = check.checked;
          progress();
          persist();
        };
        label.append(check, el("span", "", t.text));
        li.append(
          label,
          button("remove", "Удалить задачу «" + t.text + "»", () => {
            w.items.splice(w.items.indexOf(t), 1);
            update();
            progress();
            input.focus();
            persist();
          }),
        );
        list.append(li);
      }
    }
    const form = el("form", "taskform"),
      input = el("input");
    input.placeholder = "Новая задача";
    input.setAttribute("aria-label", "Новая задача");
    const plus = button("plus", "Добавить задачу");
    plus.type = "submit";
    form.append(input, plus);
    body.append(form);
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!input.value.trim()) return input.focus();
      w.items.push({ id: Store.uid(), text: input.value.trim(), done: false });
      input.value = "";
      update();
      progress();
      input.focus();
      persist();
    };
    const foot = el("div", "progress");
    body.append(foot);
    function progress() {
      foot.textContent =
        "Выполнено " +
        w.items.filter((t) => t.done).length +
        " из " +
        w.items.length;
    }
    update();
    progress();
  }
  async function loadChart(w) {
    w.status = "loading";
    refresh(w);
    persist();
    try {
      await new Promise((resolve, reject) =>
        setTimeout(
          () => (Math.random() < 0.15 ? reject() : resolve()),
          500 + Math.random() * 500,
        ),
      );
      w.status = "ready";
    } catch {
      w.status = "error";
    }
    if (cards.has(w.id)) {
      refresh(w);
      persist();
    }
  }
  function chartBody(w, body) {
    if (w.status === "loading") {
      const loading = el("p", "loading", "Загрузка данных…");
      loading.setAttribute("role", "status");
      body.append(loading);
      return;
    }
    if (w.status === "error") {
      body.append(el("p", "", "Не удалось загрузить данные."));
      const retry = el("button", "", "Повторить");
      retry.onclick = () => loadChart(w);
      body.append(retry);
      return;
    }
    const plot = el("div", "plot"),
      scale = Math.max(1, ...w.values.map(Math.abs)),
      hi = Math.max(0, ...w.values) / scale,
      lo = Math.min(0, ...w.values) / scale,
      range = hi - lo || 1;
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    w.values.forEach((n, i) => {
      const col = el("div", "col"),
        area = el("div", "area"),
        bar = el("div", "bar"),
        v = n / scale;
      bar.style.height = (Math.abs(v) / range) * 100 + "%";
      bar.style.bottom = ((Math.min(0, v) - lo) / range) * 100 + "%";
      bar.title = String(n);
      area.append(bar);
      const label = w.values.length === 7 ? days[i] : String(i + 1);
      col.setAttribute("aria-label", label + " — " + n);
      col.append(area, el("small", "", label));
      plot.append(col);
    });
    body.append(plot);
  }
  function mount(w) {
    const card = el("article", "card " + w.type);
    card.dataset.id = w.id;
    cards.set(w.id, card);
    grid.insertBefore(card, tile);
    refresh(w);
  }
  function refresh(w) {
    const card = cards.get(w.id);
    card.replaceChildren();
    const head = el("div", "cardhead"),
      badge = el("span", "badge");
    badge.innerHTML = icon(w.type);
    badge.append(kinds[w.type]);
    const grip = button(
      "grip",
      "Переместить виджет мышью или клавишами со стрелками",
    );
    grip.classList.add("handle");
    grip.draggable = true;
    head.append(badge, grip);
    const title = el("h3", "", w.title);
    title.ondblclick = () => editor(w);
    card.append(head, title);
    const body = el("div", "body");
    body.hidden = w.collapsed;
    card.append(body);
    if (w.type === "note") {
      const txt = el("p", "note-text", w.text || "Добавьте текст заметки");
      txt.ondblclick = () => editor(w);
      body.append(txt);
    }
    if (w.type === "tasks") tasksBody(w, body);
    if (w.type === "chart") chartBody(w, body);
    if (w.type === "counter") {
      const num = el("output", "number", String(w.value)),
        row = el("div", "countrow");
      function increment(dir) {
        const next = Number((w.value + dir * w.step).toPrecision(15));
        if (!Number.isFinite(next)) return toast("Достигнут предел числа");
        w.value = next;
        num.textContent = String(next);
        persist();
      }
      row.append(
        button("minus", "Уменьшить", () => increment(-1)),
        el("span", "", "Шаг " + w.step),
        button("plus", "Увеличить", () => increment(1)),
      );
      body.append(num, row);
    }
    const foot = el("div", "foot"),
      edit = button("edit", "Изменить", () => editor(w), true);
    edit.classList.add("edit");
    const toggle = button(
      w.collapsed ? "expand" : "collapse",
      w.collapsed ? "Развернуть" : "Свернуть",
      () => {
        w.collapsed = !w.collapsed;
        refresh(w);
        card.querySelector(".toggle").focus();
        persist();
      },
    );
    toggle.classList.add("toggle");
    toggle.setAttribute("aria-expanded", String(!w.collapsed));
    card.classList.toggle("folded", w.collapsed);
    foot.append(
      edit,
      toggle,
      button("remove", "Удалить виджет", () =>
        confirmAction(
          "Удалить виджет?",
          "«" + w.title + "» будет удалён.",
          "Удалить",
          () => {
            state.widgets.splice(state.widgets.indexOf(w), 1);
            card.remove();
            cards.delete(w.id);
            summary();
            add.focus();
            toast("Виджет удалён");
            persist();
          },
        ),
      ),
    );
    card.append(foot);
  }
  enableSorting(grid, (id, to) => {
    const a = state.widgets.findIndex((w) => w.id === id),
      b = state.widgets.findIndex((w) => w.id === to);
    if (a < 0 || b < 0) return;
    state.widgets.splice(b, 0, state.widgets.splice(a, 1)[0]);
    grid.insertBefore(
      cards.get(id),
      cards.get(state.widgets[b + 1]?.id) || tile,
    );
    persist();
    toast("Порядок изменён");
  });
  applyTheme();
  state.widgets.forEach(mount);
  summary();
  persist();
  state.widgets
    .filter((w) => w.type === "chart" && w.status === "loading")
    .forEach(loadChart);
})();
