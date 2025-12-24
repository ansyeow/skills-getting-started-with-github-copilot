document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove("hidden");
    setTimeout(() => messageEl.classList.add("hidden"), 4000);
  }

  async function fetchActivities() {
    activitiesList.innerHTML = "<p>Loading activities...</p>";
    try {
      const res = await fetch("/activities", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load activities");
      const activities = await res.json();
      renderActivities(activities);
      populateSelect(activities);
    } catch (err) {
      activitiesList.innerHTML = `<p class="error">Could not load activities.</p>`;
      console.error(err);
    }
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    for (const [name, info] of Object.entries(activities)) {
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;

      const desc = document.createElement("p");
      desc.textContent = info.description;

      const schedule = document.createElement("p");
      schedule.innerHTML = `<strong>Schedule:</strong> ${info.schedule}`;

      // Participants header with count badge
      const participantsHeader = document.createElement("p");
      participantsHeader.className = "participants-header";
      const count = info.participants ? info.participants.length : 0;
      participantsHeader.innerHTML = `<strong>Participants</strong> <span class="participant-count">${count}</span>`;

      const ul = document.createElement("ul");
      ul.className = "participants-list";
      if (info.participants && info.participants.length) {
        info.participants.forEach((p) => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const span = document.createElement("span");
          span.textContent = p;
          span.className = "participant-email";

          const btn = document.createElement("button");
          btn.className = "delete-btn";
          btn.title = `Unregister ${p}`;
          btn.type = "button";
          btn.innerHTML = "✖";
              btn.addEventListener("click", async () => {
            try {
                  const url = `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`;
                  const res = await fetch(url, { method: "DELETE", cache: "no-store" });
              const data = await res.json();
              if (!res.ok) {
                showMessage(data.detail || data.message || "Could not unregister", "error");
              } else {
                showMessage(data.message || "Unregistered", "success");
                await fetchActivities();
              }
            } catch (err) {
              console.error(err);
              showMessage("Network error while unregistering.", "error");
            }
          });

          li.appendChild(span);
          li.appendChild(btn);
          ul.appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.textContent = "No participants yet";
        li.className = "muted";
        ul.appendChild(li);
      }

      // Append to card
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(schedule);
      card.appendChild(participantsHeader);
      card.appendChild(ul);

      activitiesList.appendChild(card);
    }
  }

  function populateSelect(activities) {
    // preserve the first placeholder option
    activitySelect.querySelectorAll("option:not([value])").forEach(() => {});
    // clear existing dynamic options
    Array.from(activitySelect.options)
      .filter((o) => o.value)
      .forEach((o) => o.remove());
    Object.keys(activities).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;
    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }
    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.detail || "Signup failed", "error");
      } else {
        showMessage(data.message || "Signed up!", "success");
        // refresh activities to show updated participants
        await fetchActivities();
        signupForm.reset();
      }
    } catch (err) {
      console.error(err);
      showMessage("Network error during signup.", "error");
    }
  });

  // initial load
  fetchActivities();
});
