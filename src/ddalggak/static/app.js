let csrfToken = "";
let user = null;
let authMode = "login";

const el = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
};

async function api(path, method = "GET", body = undefined) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "요청을 처리하지 못했습니다.");
  return data;
}

function notice(message) {
  document.getElementById("notice").textContent = message || "";
}

function showView(name) {
  for (const section of document.querySelectorAll(".view")) {
    section.hidden = section.id !== `${name}-view`;
  }
  for (const button of document.querySelectorAll(".nav-button")) {
    button.classList.toggle("active", button.dataset.view === name);
  }
  notice("");
  if (name === "feed") loadFeed();
  if (name === "bookmarks") loadBookmarks();
  if (name === "profile") loadProfile();
  if (name === "admin") loadCandidates();
}

function renderAccount() {
  const box = document.getElementById("account");
  box.replaceChildren();
  document.getElementById("admin-nav").hidden = user?.role !== "admin";
  const button = el("button", "secondary", user ? "로그아웃" : "로그인");
  button.addEventListener("click", async () => {
    if (user) {
      try {
        await api("/api/logout", "POST");
        user = null;
        const data = await api("/api/session");
        csrfToken = data.csrf_token;
        renderAccount();
        showView("feed");
      } catch (error) { notice(error.message); }
    } else {
      document.getElementById("auth-dialog").showModal();
    }
  });
  box.append(button);
}

function renderCards(target, items, emptyMessage) {
  const container = document.getElementById(target);
  container.replaceChildren();
  if (!items.length) {
    container.append(el("p", "empty", emptyMessage));
    return;
  }
  for (const item of items) {
    const card = el("article", "card");
    card.append(el("span", "badge", `${item.type === "scholarship" ? "장학금" : "공모전"} · ${item.deadline_status}`));
    card.append(el("h3", "", item.title));
    card.append(el("p", "", item.organizer));
    card.append(el("p", "", item.eligibility_text));
    card.append(el("p", "", item.deadline_label));
    card.append(el("p", "source", `출처 ${item.source_name} · 마지막 확인 ${item.last_verified_at.slice(0, 10)}`));
    if (item.reasons) card.append(el("p", "reason", item.reasons.join(" · ")));
    const actions = el("div", "card-actions");
    const link = el("a", "primary", "공식 원문 보기 ↗");
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.append(link);
    if (user) {
      const save = el("button", "secondary", target === "bookmark-list" ? "저장 해제" : "관심 저장");
      save.addEventListener("click", async () => {
        try {
          await api(`/api/me/bookmarks/${item.id}`, target === "bookmark-list" ? "DELETE" : "PUT");
          notice(target === "bookmark-list" ? "관심 공고에서 해제했어요." : "관심 공고에 저장했어요.");
          if (target === "bookmark-list") loadBookmarks();
        } catch (error) { notice(error.message); }
      });
      actions.append(save);
    }
    card.append(actions);
    container.append(card);
  }
}

async function loadFeed() {
  try {
    const data = await api("/api/feed");
    document.getElementById("feed-count").textContent = `${data.total}개 공고`;
    renderCards("feed-list", data.items, "아직 검수된 공고가 없어요. 수집한 공고를 확인한 뒤 이곳에 추천합니다.");
  } catch (error) { notice(error.message); }
}

async function loadBookmarks() {
  if (!user) { notice("관심 공고를 보려면 로그인하세요."); return; }
  try {
    const data = await api("/api/me/bookmarks");
    renderCards("bookmark-list", data.items, "저장한 공고가 없어요.");
  } catch (error) { notice(error.message); }
}

async function loadProfile() {
  if (!user) { notice("내 조건을 저장하려면 로그인하세요."); return; }
  try {
    const data = await api("/api/me/profile");
    const form = document.getElementById("profile-form");
    form.elements.interests.value = data.interests.join(", ");
    form.elements.grade.value = data.grade || "";
    form.elements.region.value = data.region || "";
  } catch (error) { notice(error.message); }
}

function field(name, label, value = "", type = "text", wide = false) {
  const wrapper = el("label", wide ? "wide" : "", label);
  const input = el(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  input.name = name;
  input.value = value || "";
  wrapper.append(input);
  return wrapper;
}

async function loadCandidates() {
  if (user?.role !== "admin") return;
  try {
    const data = await api("/api/admin/candidates");
    const list = document.getElementById("candidate-list");
    list.replaceChildren();
    if (!data.items.length) { list.append(el("p", "empty", "새로 수집된 검수 후보가 없습니다.")); return; }
    for (const item of data.items) {
      const card = el("article", "candidate");
      card.append(el("span", "badge", item.source_name));
      card.append(el("h3", "", item.raw_title));
      const link = el("a", "", "원문 확인 ↗");
      link.href = item.source_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link, el("p", "hint", item.raw_content.slice(0, 350)));
      const form = el("form", "form-stack");
      form.append(field("title", "제목", item.raw_title));
      form.append(field("organizer", "주최기관"));
      const typeLabel = el("label", "", "유형");
      const select = el("select");
      select.name = "type";
      for (const [value, text] of [["contest", "공모전"], ["scholarship", "장학금"]]) {
        const option = el("option", "", text);
        option.value = value;
        select.append(option);
      }
      typeLabel.append(select);
      form.append(typeLabel, field("tags", "분야 태그 (쉼표 구분)"));
      form.append(field("eligibility_text", "지원 자격", "", "textarea", true));
      form.append(field("benefits_text", "혜택", "", "textarea", true));
      form.append(field("application_text", "신청 방법", "", "textarea", true));
      form.append(field("region", "지역 (전국 또는 시·도)"));
      form.append(field("grade_min", "최소 학년", "", "number"));
      form.append(field("grade_max", "최대 학년", "", "number"));
      const kindLabel = el("label", "", "마감 정보");
      const kind = el("select");
      kind.name = "deadline_kind";
      for (const [value, text] of [["unknown", "미정"], ["always_open", "상시"], ["date_only", "날짜만 확인"], ["datetime", "시각까지 확인"]]) {
        const option = el("option", "", text); option.value = value; kind.append(option);
      }
      kindLabel.append(kind);
      form.append(kindLabel, field("deadline_date", "마감일", "", "date"));
      form.append(field("deadline_at", "마감 시각 (시간대 포함, 예: 2026-12-31T18:00:00+09:00)", "", "text", true));
      const publish = el("button", "primary wide", "검수 완료 · 게시");
      publish.type = "submit";
      form.append(publish);
      const reject = el("button", "secondary wide", "공고 아님 · 제외");
      reject.type = "button";
      reject.addEventListener("click", async () => {
        try {
          await api(`/api/admin/candidates/${item.id}/reject`, "POST");
          notice("후보를 제외했어요.");
          loadCandidates();
        } catch (error) { notice(error.message); }
      });
      form.append(reject);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form));
        values.grade_min = values.grade_min ? Number(values.grade_min) : null;
        values.grade_max = values.grade_max ? Number(values.grade_max) : null;
        values.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
        try {
          await api(`/api/admin/candidates/${item.id}/publish`, "POST", values);
          notice("공고를 게시했어요.");
          loadCandidates();
        } catch (error) { notice(error.message); }
      });
      card.append(form);
      list.append(card);
    }
  } catch (error) { notice(error.message); }
}

document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
document.getElementById("profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await api("/api/me/profile", "PUT", {
      interests: form.elements.interests.value.split(",").map((item) => item.trim()).filter(Boolean),
      grade: form.elements.grade.value ? Number(form.elements.grade.value) : null,
      region: form.elements.region.value.trim() || null,
    });
    showView("feed");
  } catch (error) { notice(error.message); }
});
document.getElementById("close-auth").addEventListener("click", () => document.getElementById("auth-dialog").close());
document.getElementById("auth-switch").addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  document.getElementById("auth-title").textContent = authMode === "login" ? "로그인" : "회원가입";
  document.getElementById("auth-submit").textContent = authMode === "login" ? "로그인" : "회원가입";
  document.getElementById("auth-switch").textContent = authMode === "login" ? "회원가입하기" : "로그인하기";
});
document.getElementById("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api(authMode === "login" ? "/api/login" : "/api/signup", "POST", {
      email: form.elements.email.value, password: form.elements.password.value,
    });
    if (data.csrf_token) csrfToken = data.csrf_token;
    const state = await api("/api/session");
    user = state.user;
    csrfToken = state.csrf_token;
    document.getElementById("auth-dialog").close();
    form.reset();
    renderAccount();
    showView("profile");
  } catch (error) { notice(error.message); document.getElementById("auth-dialog").close(); }
});

api("/api/session").then((data) => {
  csrfToken = data.csrf_token;
  user = data.user;
  renderAccount();
  showView("feed");
}).catch((error) => notice(error.message));
