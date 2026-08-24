/* VOLTFIELD -- shared practice-progress state.

   The tools already recorded streaks, daily-challenge completions, solved
   scenarios and quiz bests in localStorage; nothing ever read them back
   outside the tool that wrote them, so a returning visitor saw a homepage
   identical to a first-timer's. This module is the single reader.

   Everything here is derived, never written: the tools remain the only
   writers of their own keys, so this cannot corrupt practice state.

   Storage shapes (set by the tools):
     vf_sandbox_streak      {lastDate:'YYYY-MM-DD', current:n, longest:n}
     vf_sandbox_daily_done  ['YYYY-MM-DD', ...]
     vf_sandbox_progress    ['clean','voltage-drop', ...]   scenario ids
     vf_pod_solved          {scenarioId:true, ...}
     vf_glossary_quiz_best  '7'                             number as string
     vf_recent              [...]  recently viewed parts, max 12
*/
(function(){
  'use strict';

  /* Must match the sandbox's own date helpers exactly, or the daily challenge
     shown here would disagree with the one the sandbox serves. */
  function dateKey(d){
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  }
  function dayOfYear(d){
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  function readJSON(key, fallback){
    try {
      const v = JSON.parse(localStorage.getItem(key) || 'null');
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  /* Scenario counts are the tools' own lists. Kept here as counts only (not
     duplicated content) so "3 of 6" can be shown without loading the sandbox. */
  const SANDBOX_SCENARIOS = 6;
  const POD_SCENARIOS = 4;

  /* A streak is only alive if it was fed today or yesterday. The sandbox's own
     badge printed `current` unconditionally, so a run abandoned three weeks ago
     still announced itself as an active streak -- which is simply untrue, and
     the kind of fake-progress nudge that makes a site feel dishonest. */
  function streak(){
    const st = readJSON('vf_sandbox_streak', null) || {};
    const current = Number(st.current) || 0;
    const longest = Number(st.longest) || 0;
    const last = st.lastDate || null;

    const today = dateKey(new Date());
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = dateKey(y);

    const doneToday = last === today;
    const alive = doneToday || last === yesterday;

    return {
      current: alive ? current : 0,   // an expired run is not a streak
      longest: longest,
      lastDate: last,
      alive: alive,
      doneToday: doneToday,
      // fed yesterday but not yet today: today is the day it breaks
      atRisk: alive && !doneToday && current > 0,
      expired: !alive && current > 0
    };
  }

  function dailyChallenge(){
    const done = readJSON('vf_sandbox_daily_done', []);
    const today = dateKey(new Date());
    return {
      index: dayOfYear(new Date()) % SANDBOX_SCENARIOS,
      doneToday: Array.isArray(done) && done.indexOf(today) > -1
    };
  }

  function counts(){
    const sandbox = readJSON('vf_sandbox_progress', []);
    const pod = readJSON('vf_pod_solved', {});
    let best = 0;
    try { best = parseInt(localStorage.getItem('vf_glossary_quiz_best') || '0', 10) || 0; } catch (e) {}
    const recent = readJSON('vf_recent', []);
    return {
      sandboxDone: Array.isArray(sandbox) ? sandbox.length : 0,
      sandboxTotal: SANDBOX_SCENARIOS,
      podDone: (pod && typeof pod === 'object') ? Object.keys(pod).filter(function(k){ return pod[k]; }).length : 0,
      podTotal: POD_SCENARIOS,
      quizBest: best,
      recentCount: Array.isArray(recent) ? recent.length : 0
    };
  }

  function summary(){
    const s = streak(), d = dailyChallenge(), c = counts();
    // "has done something" -- what decides whether a returning-user UI shows at all
    const active = c.sandboxDone > 0 || c.podDone > 0 || c.quizBest > 0 ||
                   c.recentCount > 0 || s.longest > 0;
    return { streak: s, daily: d, counts: c, active: active };
  }

  /* The single most useful next action, given what they have and have not done.
     Ordered by what actually moves someone along rather than by tool: an
     unfinished daily is time-boxed and disappears at midnight, so it outranks
     scenario grinding. */
  function nextAction(){
    const s = summary();
    if (!s.daily.doneToday) {
      return {
        label: s.streak.atRisk ? 'Keep your streak alive' : "Today's challenge",
        detail: s.streak.atRisk
          ? 'Your ' + s.streak.current + '-day streak breaks at midnight.'
          : 'A new practice scenario, picked fresh each day.',
        href: 'voltfield-sandbox.html#daily',
        urgent: s.streak.atRisk
      };
    }
    if (s.counts.sandboxDone < s.counts.sandboxTotal) {
      return { label: 'Next practice scenario',
               detail: (s.counts.sandboxTotal - s.counts.sandboxDone) + ' of ' + s.counts.sandboxTotal + ' still unsolved.',
               href: 'voltfield-sandbox.html', urgent: false };
    }
    if (s.counts.podDone < s.counts.podTotal) {
      return { label: 'POD & Skid challenges',
               detail: (s.counts.podTotal - s.counts.podDone) + ' of ' + s.counts.podTotal + ' still unsolved.',
               href: 'voltfield-pod-designer.html', urgent: false };
    }
    return { label: 'Build a rack elevation',
             detail: 'You have cleared the practice scenarios — try the rack builder.',
             href: 'voltfield-rack-builder.html', urgent: false };
  }

  window.VFProgress = {
    summary: summary,
    streak: streak,
    daily: dailyChallenge,
    counts: counts,
    nextAction: nextAction,
    dateKey: dateKey,
    dayOfYear: dayOfYear
  };
})();
