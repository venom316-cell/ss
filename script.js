// script.js
// Handles both proposal page and admin dashboard
// Saves answers to BOTH: localStorage (per-device history) and Firebase Firestore (shared online)

// ----- Firebase config (REPLACE with your real values) -----
// Get these from Firebase Console → Project settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (e) {
  console.warn(
    "Firebase is not configured correctly yet. Local history will still work, but shared online responses won't.",
    e
  );
}

// Keys & collection
const STORAGE_KEY = "proposalAnswers"; // local device history
const RESPONSES_COLLECTION = "responses"; // Firestore collection

async function saveAnswer(choice) {
  const nowIso = new Date().toISOString();

  // Save to localStorage (per-device)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }
    }
    list.push({ choice, time: nowIso });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {
    // ignore
  }

  // Save to Firestore (shared online)
  try {
    if (db) {
      await db.collection(RESPONSES_COLLECTION).add({
        choice,
        time: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent || "",
      });
    }
  } catch (e) {
    console.warn("Could not save to Firestore, using only local history.", e);
  }
}

/* ------------------------------ Page Routing ------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "proposal") {
    initProposalPage();
  } else if (page === "admin") {
    initAdminPage();
  }
});

/* ----------------------------- Proposal Logic ----------------------------- */

function initProposalPage() {
  const playfulMessage = document.getElementById("playfulMessage");
  const statusMessage = document.getElementById("statusMessage");
  const acceptBtn = document.getElementById("acceptBtn");
  const rejectBtn = document.getElementById("rejectBtn");
  const thankYouScreen = document.getElementById("thankYouScreen");
  const celebrationLayer = document.getElementById("celebrationLayer");
  const acceptSound = document.getElementById("acceptSound");

  let rejectClicks = 0;
  let isSubmitted = false;

  const playfulLines = [
    "Are you sure? 🥺",
    "Think again 😏",
    "My heart is waiting very patiently... kinda 🫠",
    "You only have one option now ❤️",
  ];

  function setStatus(text, type = "") {
    if (!statusMessage) return;
    statusMessage.textContent = text || "";
    statusMessage.classList.remove("success", "error");
    if (type) statusMessage.classList.add(type);
  }

  function setPlayful(index) {
    playfulMessage.textContent =
      playfulLines[index] || "You only have one option now ❤️";
  }

  rejectBtn.addEventListener("click", async () => {
    if (isSubmitted) return;

    rejectClicks += 1;

    // Grow accept button every reject
    const scale = 1 + Math.min(rejectClicks * 0.18, 1.0);
    acceptBtn.style.transform = `scale(${scale})`;
    acceptBtn.style.fontSize = `${0.95 + rejectClicks * 0.1}rem`;

    if (rejectClicks <= 3) {
      setPlayful(rejectClicks - 1);
    } else {
      setPlayful(3);
    }

    // After 3–4 rejects, hide the reject button
    if (rejectClicks >= 3) {
      rejectBtn.style.opacity = "0";
      rejectBtn.style.transform = "translateY(8px)";
      setTimeout(() => {
        rejectBtn.style.display = "none";
      }, 250);
    }

    // Show what she chose right away
    setStatus("She clicked NO (Reject) 💔", "error");

    // Save locally so you can still see later (and admin page can read it)
    saveAnswer("Reject");
  });

  acceptBtn.addEventListener("click", async () => {
    if (isSubmitted) return;

    const name = "My forever girl";
    const message = "";

    setStatus("She clicked YES (Accept) 💖", "success");

    // Save locally so you can still see later (and admin page can read it)
    saveAnswer("Accept");

    try {
      isSubmitted = true;
      // Keep the "She clicked YES" message visible

      // Disable buttons
      [acceptBtn, rejectBtn].forEach((el) => {
        if (el) el.disabled = true;
      });

      // Show thank you screen
      thankYouScreen.classList.remove("hidden");

      // Celebration
      triggerCelebration(celebrationLayer);

      // Play cute sound if available
      if (acceptSound && typeof acceptSound.play === "function") {
        acceptSound.currentTime = 0;
        acceptSound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    } catch (err) {
      console.error(err);
      setStatus(
        "Oops, something went wrong saving your answer. Could you try again? 🥹",
        "error"
      );
    }
  });
}

function triggerCelebration(layer) {
  if (!layer) return;
  layer.classList.remove("hidden");
  const count = 30;
  layer.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "celebration-heart";

    const startX = Math.random() * 100; // viewport width %
    const x = (Math.random() - 0.5) * 260; // horizontal burst
    const y = -120 - Math.random() * 160; // upwards

    heart.style.left = `${startX}vw`;
    heart.style.bottom = "10vh";
    heart.style.setProperty("--x", `${x}px`);
    heart.style.setProperty("--y", `${y}px`);
    heart.style.animationDelay = `${Math.random() * 0.4}s`;
    heart.style.opacity = "0.9";

    layer.appendChild(heart);
  }

  setTimeout(() => {
    layer.classList.add("hidden");
    layer.innerHTML = "";
  }, 2000);
}

/* ------------------------------ Admin Logic ------------------------------- */

function initAdminPage() {
  const ADMIN_PASSWORD = "my-secret-password"; // CHANGE THIS

  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("adminPassword");
  const loginError = document.getElementById("loginError");
  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("adminDashboard");
  const refreshBtn = document.getElementById("refreshBtn");
  const responsesBody = document.getElementById("responsesBody");
  const emptyState = document.getElementById("emptyState");
  const adminStatus = document.getElementById("adminStatus");

  let isAuthed = false;

  function setAdminStatus(text, type = "") {
    adminStatus.textContent = text || "";
    adminStatus.classList.remove("success", "error");
    if (type) adminStatus.classList.add(type);
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = passwordInput.value;

    if (!value) {
      loginError.textContent = "Please enter the password 💡";
      return;
    }

    if (value === ADMIN_PASSWORD) {
      isAuthed = true;
      loginError.textContent = "";
      loginCard.classList.add("hidden");
      dashboard.classList.remove("hidden");
      loadResponses();
    } else {
      loginError.textContent = "Wrong password, my love. Try again 💔";
    }
  });

  refreshBtn.addEventListener("click", () => {
    if (!isAuthed) return;
    loadResponses();
  });

  async function loadResponses() {
    responsesBody.innerHTML = "";

    // First try Firestore (shared online responses)
    if (db) {
      try {
        setAdminStatus("Loading responses from Firestore… ✨");
        emptyState.style.display = "none";

        const snapshot = await db
          .collection(RESPONSES_COLLECTION)
          .orderBy("time", "desc")
          .get();

        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement("tr");

            const tdName = document.createElement("td");
            tdName.textContent = "Someone special";

            const tdChoice = document.createElement("td");
            tdChoice.textContent = data.choice || "-";
            tdChoice.classList.add(
              (data.choice || "").toLowerCase() === "accept"
                ? "choice-accept"
                : "choice-reject"
            );

            const tdMsg = document.createElement("td");
            tdMsg.textContent = "—";

            const tdTime = document.createElement("td");
            tdTime.textContent =
              data.time && data.time.toDate
                ? data.time.toDate().toLocaleString()
                : "-";

            tr.appendChild(tdName);
            tr.appendChild(tdChoice);
            tr.appendChild(tdMsg);
            tr.appendChild(tdTime);

            responsesBody.appendChild(tr);
          });

          emptyState.style.display = "none";
          setAdminStatus("Loaded all online responses 💖", "success");
          return;
        }

        // If Firestore is empty, fall back to local
        setAdminStatus(
          "No online responses yet. Showing answers from this device.",
          "error"
        );
      } catch (err) {
        console.warn("Failed to load from Firestore, falling back to local.", err);
      }
    }

    // Fallback: read all answers from localStorage (per-device)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        emptyState.style.display = "block";
        setAdminStatus(
          "No saved answer found on this device yet 🥹",
          "error"
        );
        return;
      }

      const list = JSON.parse(stored);
      if (!Array.isArray(list) || list.length === 0) {
        emptyState.style.display = "block";
        setAdminStatus(
          "No saved answers found on this device yet 🥹",
          "error"
        );
        return;
      }

      list
        .slice()
        .reverse()
        .forEach((item) => {
          const tr = document.createElement("tr");

          const tdName = document.createElement("td");
          tdName.textContent = "Your special girl";

          const tdChoice = document.createElement("td");
          tdChoice.textContent = item.choice || "-";
          tdChoice.classList.add(
            (item.choice || "").toLowerCase() === "accept"
              ? "choice-accept"
              : "choice-reject"
          );

          const tdMsg = document.createElement("td");
          tdMsg.textContent = "—";

          const tdTime = document.createElement("td");
          tdTime.textContent = item.time
            ? new Date(item.time).toLocaleString()
            : "-";

          tr.appendChild(tdName);
          tr.appendChild(tdChoice);
          tr.appendChild(tdMsg);
          tr.appendChild(tdTime);

          responsesBody.appendChild(tr);
        });

      emptyState.style.display = "none";
      setAdminStatus("Loaded all answers from this device 💖", "success");
    } catch (e) {
      console.error(e);
      emptyState.style.display = "block";
      setAdminStatus("Could not read saved answer 🥹", "error");
    }
  }
}
