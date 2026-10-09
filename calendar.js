// Shared calendar helpers: load calendar.json (written by scripts/calendar_plan.py via
// refresh_dashboard.py) and turn it into "N days left" messages against the *real*
// current date, so the numbers stay right between refreshes.

function loadCalendar() {
  return fetch("calendar.json").then((r) => r.json());
}

const DAY_MS = 86400000;
function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function daysBetween(a, b) { return Math.round((dayStart(b) - dayStart(a)) / DAY_MS); }
function fmtDate(iso) { return parseISO(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); }
function plural(n, w) { return `${n} ${w}${Math.abs(n) === 1 ? "" : "s"}`; }
function hrs(h) { return `${Math.round(h * 10) / 10} h`; }

// -> [{kind: "phase"|"topic"|"milestone"|"warn", text}]
function calendarMessages(cal, now = new Date()) {
  const msgs = [];
  const gen = parseISO(cal.today);
  const stale = daysBetween(gen, now);
  if (stale > 1) msgs.push({ kind: "warn", text: `Calendar was generated ${plural(stale, "day")} ago — run refresh_dashboard.py to re-flow dates.` });

  const pendingCore = cal.topics.filter((t) => t.lane === "core" && t.status === "pending" && t.start);
  const first = pendingCore[0];
  if (first) {
    const ph = cal.phases.find((p) => p.subject === first.subject && p.phase === first.phase);
    if (ph && ph.end) {
      const left = daysBetween(now, parseISO(ph.end));
      const when = left < 0 ? `${plural(-left, "day")} past its planned end` : left === 0 ? "ends today" : `${plural(left, "day")} left`;
      msgs.push({ kind: "phase", text: `${first.subject} Ph${first.phase}${ph.estimate ? " (~)" : ""} — ${when} · ${hrs(ph.hours_left)} to go · planned finish ${fmtDate(ph.end)}` });
    }
    const slip = daysBetween(parseISO(first.start), now);
    const tl = first.end ? daysBetween(now, parseISO(first.end)) : null;
    msgs.push({ kind: "topic", text: `Now: ${first.title} — ${hrs(first.hours)}${tl !== null ? (tl <= 0 ? " · due today" : ` · ${plural(tl, "day")}`) : ""}` });
    if (slip > 0) msgs.push({ kind: "warn", text: `Behind plan by ${plural(slip, "day")} — the current topic was scheduled to start ${fmtDate(first.start)}. Dates re-flow once topics are marked done.` });
    const next = pendingCore[1];
    if (next) msgs.push({ kind: "topic", text: `Next: ${next.title} — starts ${fmtDate(next.start)}` });
  } else {
    msgs.push({ kind: "phase", text: "Fast-track topics are all done. Optional lane is open." });
  }

  const ms = cal.milestones.map((m) => ({ ...m, left: daysBetween(now, parseISO(m.date)) })).filter((m) => m.left >= -7);
  ms.sort((a, b) => a.left - b.left);
  if (ms[0]) {
    const m = ms[0];
    const verdict = m.slack_days >= 0 ? `on track (+${m.slack_days} d slack)` : `behind by ${plural(-m.slack_days, "day")}`;
    msgs.push({ kind: m.slack_days >= 0 ? "milestone" : "warn", text: `${m.label}: ${m.left >= 0 ? plural(m.left, "day") + " away" : plural(-m.left, "day") + " ago"} — projected ready ${fmtDate(m.projected_ready)}, ${verdict}` });
  }
  return msgs;
}

function renderCalendarBanner(el) {
  loadCalendar().then((cal) => {
    const msgs = calendarMessages(cal).slice(0, 4);
    el.innerHTML = msgs.map((m) => `<div class="cal-msg ${m.kind}">${m.text.replace(/</g, "&lt;")}</div>`).join("") +
      `<a class="cal-more" href="calendar.html">Open calendar →</a>`;
    el.hidden = false;
  }).catch(() => { el.hidden = true; });
}
