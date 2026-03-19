function createField(labelText, inputType, placeholder) {
  const wrapper = document.createElement("label");
  Object.assign(wrapper.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  const label = document.createElement("span");
  label.textContent = labelText;
  Object.assign(label.style, {
    color: "var(--color-text-secondary)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.2px",
  });

  const input = document.createElement("input");
  input.type = inputType;
  input.placeholder = placeholder;
  Object.assign(input.style, {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "var(--color-bg-section)",
    color: "var(--color-text-primary)",
    outline: "none",
    fontSize: "14px",
  });

  wrapper.append(label, input);
  return { wrapper, input };
}

async function submitAuth(mode, username, password) {
  const response = await fetch(`/api/auth/${mode}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export function auth_tool() {
  if (document.getElementById("auth-tool-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "auth-tool-modal";
  overlay.onclick = (event) => event.target === overlay && overlay.remove();

  Object.assign(overlay.style, {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "16px",
  });

  const modal = document.createElement("div");
  modal.onclick = (event) => event.stopPropagation();
  Object.assign(modal.style, {
    width: "min(560px,100%)",
    background: "var(--color-bg-card)",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    overflow: "hidden",
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    padding: "18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  });

  const titleWrap = document.createElement("div");

  const title = document.createElement("div");
  title.textContent = "Register / Login";
  Object.assign(title.style, {
    color: "var(--color-text-primary)",
    fontWeight: "800",
    fontSize: "16px",
  });

  const subtitle = document.createElement("div");
  subtitle.textContent = "Create an account or sign in to get your welcome message.";
  Object.assign(subtitle.style, {
    color: "var(--color-text-secondary)",
    fontSize: "12px",
    marginTop: "4px",
    lineHeight: "1.5",
  });

  titleWrap.append(title, subtitle);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.onclick = () => overlay.remove();
  Object.assign(closeBtn.style, {
    cursor: "pointer",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(10,15,28,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--color-text-primary)",
  });

  header.append(titleWrap, closeBtn);

  const body = document.createElement("div");
  Object.assign(body.style, {
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  });

  const tabRow = document.createElement("div");
  Object.assign(tabRow.style, {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  });

  const registerTab = document.createElement("button");
  const loginTab = document.createElement("button");
  let currentMode = "register";

  const baseTabStyles = {
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: "800",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "all 0.15s ease",
  };

  Object.assign(registerTab.style, baseTabStyles);
  Object.assign(loginTab.style, baseTabStyles);
  registerTab.textContent = "Register";
  loginTab.textContent = "Login";

  const form = document.createElement("form");
  Object.assign(form.style, {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  });

  const usernameField = createField("Username", "text", "Enter username");
  const passwordField = createField("Password", "password", "At least 6 characters");

  const hint = document.createElement("div");
  Object.assign(hint.style, {
    color: "var(--color-text-muted)",
    fontSize: "12px",
    lineHeight: "1.5",
  });

  const status = document.createElement("div");
  Object.assign(status.style, {
    minHeight: "22px",
    fontSize: "13px",
    lineHeight: "1.5",
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Create account";
  Object.assign(submitBtn.style, {
    marginTop: "4px",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    border: "none",
    fontWeight: "800",
    background: "var(--color-accent)",
    color: "var(--color-bg-dark)",
  });

  function paintMode() {
    const registerActive = currentMode === "register";

    registerTab.style.background = registerActive
      ? "var(--color-accent)"
      : "rgba(255,255,255,0.04)";
    registerTab.style.color = registerActive
      ? "var(--color-bg-dark)"
      : "var(--color-text-primary)";

    loginTab.style.background = registerActive
      ? "rgba(255,255,255,0.04)"
      : "var(--color-accent)";
    loginTab.style.color = registerActive
      ? "var(--color-text-primary)"
      : "var(--color-bg-dark)";

    submitBtn.textContent = registerActive ? "Create account" : "Login";
    hint.textContent = registerActive
      ? "Register stores your username and password hash in D1."
      : "Login currently returns a welcome message after credential check.";
    status.textContent = "";
  }

  registerTab.onclick = () => {
    currentMode = "register";
    paintMode();
  };

  loginTab.onclick = () => {
    currentMode = "login";
    paintMode();
  };

  form.onsubmit = async (event) => {
    event.preventDefault();
    let keepSuccessState = false;

    const username = usernameField.input.value.trim();
    const password = passwordField.input.value.trim();

    if (!username || !password) {
      status.textContent = "Username and password are required.";
      status.style.color = "var(--color-warning)";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
    submitBtn.textContent = currentMode === "register" ? "Creating..." : "Logging in...";
    status.textContent = "Submitting...";
    status.style.color = "var(--color-text-secondary)";

    try {
      const payload = await submitAuth(currentMode, username, password);
      status.textContent = payload.message || "Success.";
      status.style.color = "var(--color-success)";
      passwordField.input.value = "";

      if (currentMode === "login") {
        keepSuccessState = true;
        setTimeout(() => {
          window.location.assign("/dashboard");
        }, 250);
      } else {
        currentMode = "login";
        keepSuccessState = true;
        submitBtn.textContent = "Login";
        hint.textContent = "Login currently sends you into the backend dashboard.";
      }
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "Something went wrong.";
      status.style.color = "var(--color-error)";
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      if (!keepSuccessState) {
        paintMode();
      }
    }
  };

  tabRow.append(registerTab, loginTab);
  form.append(
    usernameField.wrapper,
    passwordField.wrapper,
    hint,
    status,
    submitBtn,
  );
  body.append(tabRow, form);
  modal.append(header, body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  paintMode();
}
