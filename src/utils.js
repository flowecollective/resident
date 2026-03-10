export const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const findSkill = (masterProgram, sid) => {
  for (const cat of masterProgram) {
    const sk = cat.skills.find((s) => s.id === sid);
    if (sk) return sk;
  }
  return null;
};

export const getSkillProgress = (trainee, sid) => {
  const p = trainee.progress?.[sid];
  if (!p) return { technique: 0, timing: 0, done: false };
  if (typeof p === "boolean" || p.done !== undefined) return { technique: 0, timing: 0, done: p === true || p.done === true };
  return { technique: p.technique || 0, timing: p.timing || 0, done: false };
};

export const isSkillComplete = (trainee, sid, masterProgram) => {
  const sk = findSkill(masterProgram, sid);
  const p = getSkillProgress(trainee, sid);
  if (!sk || sk.type === "knowledge") return p.done;
  return p.technique >= 3 && p.timing >= 3;
};

export const getSkillPct = (trainee, sid, masterProgram) => {
  const sk = findSkill(masterProgram, sid);
  const p = getSkillProgress(trainee, sid);
  if (!sk || sk.type === "knowledge") return p.done ? 100 : 0;
  return Math.round(((p.technique + p.timing) / 6) * 100);
};

export const getTraineeCats = (trainee, masterProgram) => {
  const sids = new Set(trainee.skillIds || []);
  return masterProgram.map((c) => ({ ...c, skills: c.skills.filter((s) => sids.has(s.id)) })).filter(
    (c) => c.skills.length > 0
  );
};

export const getProgress = (trainee, masterProgram) => {
  const t = trainee.skillIds?.length || 0;
  if (t === 0) return { total: 0, done: 0, pct: 0 };
  let totalPoints = 0;
  let earnedPoints = 0;
  let done = 0;
  (trainee.skillIds || []).forEach((sid) => {
    const sk = findSkill(masterProgram, sid);
    const isService = sk && sk.type === "service";
    if (isService) {
      totalPoints += 6;
      const p = getSkillProgress(trainee, sid);
      earnedPoints += p.technique + p.timing;
      if (p.technique >= 3 && p.timing >= 3) done++;
    } else {
      totalPoints += 1;
      const p = getSkillProgress(trainee, sid);
      if (p.done) { earnedPoints += 1; done++; }
    }
  });
  return { total: t, done, pct: totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0 };
};

export const getEmbedUrl = (url) => {
  if (!url) return null;
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
  if (match) return "https://www.youtube.com/embed/" + match[1] + "?autoplay=1&rel=0";
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return "https://player.vimeo.com/video/" + match[1] + "?autoplay=1";
  return null;
};
