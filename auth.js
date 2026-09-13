/* OfficialLEWeb – Real LEID + Facebook auth (Meta App LEID ACCOUNT 2338993963576572) */
const STORAGE_USERS = "officialleweb_users";
const STORAGE_SESSION = "officialleweb_session";
const STORAGE_LINKS = "officialleweb_links";
const FB_APP_ID = "2338993963576572";
const ALLOWED_RETURN_HOSTS = [
  "officialleweb.vercel.app",
  "le-voice-call.vercel.app",
  "lemodz-official-site.vercel.app",
  "localhost"
];
function getUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}"); } catch { return {}; }
}
function saveUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null"); } catch { return null; }
}
function setSession(session) {
  const s = {
    leid: session.leid,
    name: session.name || session.leid,
    facebookId: session.facebookId || null,
    email: session.email || null,
    viaFacebook: !!session.viaFacebook,
    loggedInAt: session.loggedInAt || Date.now()
  };
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(s));
  try {
    localStorage.setItem("leid_session", JSON.stringify(s));
    localStorage.setItem("officialleweb_user", JSON.stringify(s));
  } catch (e) {}
}
function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
  localStorage.removeItem("leid_session");
  localStorage.removeItem("officialleweb_user");
}
function getLinks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LINKS) || "{}"); } catch { return {}; }
}
function saveLinks(links) { localStorage.setItem(STORAGE_LINKS, JSON.stringify(links)); }
function showMessage(text, type) {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent = text;
  el.className = "message " + (type || "error");
  el.hidden = false;
}
function showTab(name) {
  const login = document.getElementById("login-panel");
  const reg = document.getElementById("register-panel");
  const tLogin = document.getElementById("tab-login");
  const tReg = document.getElementById("tab-register");
  if (login) login.classList.toggle("active", name === "login");
  if (reg) reg.classList.toggle("active", name === "register");
  if (tLogin) tLogin.classList.toggle("active", name === "login");
  if (tReg) tReg.classList.toggle("active", name === "register");
  const msg = document.getElementById("message");
  if (msg) msg.hidden = true;
}
function getReturnTo() {
  try {
    const p = new URLSearchParams(location.search);
    return p.get("return_to") || p.get("return") || null;
  } catch { return null; }
}
function isAllowedReturn(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return false;
    return ALLOWED_RETURN_HOSTS.some(h => u.hostname === h || u.hostname.endsWith("." + h));
  } catch { return false; }
}
function finishAuth(session) {
  setSession(session);
  const returnTo = getReturnTo();
  if (returnTo && isAllowedReturn(returnTo)) {
    try {
      const u = new URL(returnTo);
      u.searchParams.set("leid", session.leid);
      u.searchParams.set("name", session.name || session.leid);
      if (session.facebookId) u.searchParams.set("fb", session.facebookId);
      u.searchParams.set("from", "officialleweb");
      showMessage("Signed in. Returning to app…", "success");
      setTimeout(function () { window.location.href = u.toString(); }, 450);
      return;
    } catch (e) {}
  }
  showMessage("Welcome! Opening dashboard…", "success");
  setTimeout(function () { window.location.href = "main/Main.html"; }, 500);
}
function handleRegister(e) {
  e.preventDefault();
  const leid = (document.getElementById("reg-leid").value || "").trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  if (!leid) { showMessage("Please enter a LEID / Username."); return; }
  if (password.length < 4) { showMessage("Password must be at least 4 characters."); return; }
  if (password !== confirm) { showMessage("Passwords do not match."); return; }
  const users = getUsers();
  if (users[leid.toLowerCase()]) { showMessage("This LEID is already taken."); return; }
  users[leid.toLowerCase()] = {
    leid: leid,
    password: password,
    facebookId: null,
    facebookName: null,
    email: null,
    createdAt: Date.now()
  };
  saveUsers(users);
  finishAuth({ leid: leid, name: leid, facebookId: null, viaFacebook: false, loggedInAt: Date.now() });
}
function handleLogin(e) {
  e.preventDefault();
  const leid = (document.getElementById("login-leid").value || "").trim();
  const password = document.getElementById("login-password").value;
  const users = getUsers();
  const user = users[leid.toLowerCase()];
  if (!user || user.password !== password) {
    showMessage("Invalid LEID or password.");
    return;
  }
  finishAuth({
    leid: user.leid,
    name: user.facebookName || user.leid,
    facebookId: user.facebookId || null,
    email: user.email || null,
    viaFacebook: !!user.facebookId,
    loggedInAt: Date.now()
  });
}
function waitForFB(callback) {
  if (window.FB && window.fbReady) { callback(); return; }
  let tries = 0;
  const t = setInterval(function () {
    tries++;
    if (window.FB && window.fbReady) { clearInterval(t); callback(); }
    else if (tries > 40) {
      clearInterval(t);
      showMessage("Facebook SDK failed to load. Add domains in Meta App settings.");
    }
  }, 250);
}
function facebookLogin(callback) {
  waitForFB(function () {
    FB.login(function (response) {
      if (response.authResponse) {
        FB.api("/me", { fields: "id,name,email" }, function (profile) {
          if (profile && !profile.error) {
            callback(null, {
              id: profile.id,
              name: profile.name || ("fbuser_" + profile.id),
              email: profile.email || null
            });
          } else {
            callback(profile && profile.error ? profile.error.message : "Could not read Facebook profile");
          }
        });
      } else {
        callback("Facebook login cancelled or failed.");
      }
    }, { scope: "public_profile,email" });
  });
}
function upsertFacebookUser(fb) {
  const users = getUsers();
  for (const k in users) {
    if (users[k].facebookId === fb.id) return users[k];
  }
  let leid = (fb.name || "").trim().replace(/\s+/g, "_");
  if (!leid) leid = "fb_" + fb.id;
  let key = leid.toLowerCase();
  if (users[key] && users[key].facebookId && users[key].facebookId !== fb.id) {
    leid = leid + "_" + String(fb.id).slice(-4);
    key = leid.toLowerCase();
  }
  if (!users[key]) {
    users[key] = {
      leid: leid,
      password: null,
      facebookId: fb.id,
      facebookName: fb.name,
      email: fb.email,
      createdAt: Date.now()
    };
  } else {
    users[key].facebookId = fb.id;
    users[key].facebookName = fb.name;
    if (fb.email) users[key].email = fb.email;
  }
  saveUsers(users);
  const links = getLinks();
  if (!links[key]) links[key] = {};
  links[key].facebookId = fb.id;
  saveLinks(links);
  return users[key];
}
function handleFacebookRegister() {
  showMessage("Opening Facebook…", "success");
  facebookLogin(function (err, fb) {
    if (err) { showMessage(err); return; }
    const user = upsertFacebookUser(fb);
    finishAuth({
      leid: user.leid,
      name: user.facebookName || user.leid,
      facebookId: user.facebookId,
      email: user.email,
      viaFacebook: true,
      loggedInAt: Date.now()
    });
  });
}
function handleFacebookLogin() {
  showMessage("Opening Facebook…", "success");
  facebookLogin(function (err, fb) {
    if (err) { showMessage(err); return; }
    const user = upsertFacebookUser(fb);
    finishAuth({
      leid: user.leid,
      name: user.facebookName || user.leid,
      facebookId: user.facebookId,
      email: user.email,
      viaFacebook: true,
      loggedInAt: Date.now()
    });
  });
}
(function () {
  const returnTo = getReturnTo();
  const session = getSession();
  if (returnTo && session && session.leid && isAllowedReturn(returnTo)) {
    finishAuth(session);
  }
})();
