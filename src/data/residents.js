import { ALL_SKILL_IDS } from "./masterProgram";

export const INIT_RESIDENTS = [
  {
    id: "r1",
    name: "Cheyenne Rollins",
    cohort: "Spring 2026",
    email: "cheyenne@flowecollective.com",
    onboarding: {
      agreement: { signed: true, date: "2026-01-05", url: "" },
      enrollment: { completed: true, date: "2026-01-10", plan: "monthly" },
      gusto: { completed: true, date: "2026-01-08", fields: { legalName: "Cheyenne Rollins", ssn: "***-**-1234", dob: "1998-06-15", address: "412 Magnolia St, Austin TX 78701", phone: "(512) 555-0147", emergencyName: "Daniel Rollins", emergencyPhone: "(512) 555-0199", bankRouting: "***4821", bankAccount: "***7890" } },
    },
    skillIds: [...ALL_SKILL_IDS],
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:2}, sk8: {done:true}, sk9: {technique:3,timing:2}, sk15: {technique:2,timing:0}, sk19: {done:true}, sk27: {done:true} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay1", amount: 1650, date: "2026-01-15", note: "Month 1" },
      { id: "pay2", amount: 1650, date: "2026-02-15", note: "Month 2" },
    ]},
    timingLogs: {
      sk1: [
        { minutes: 68, type: "mannequin", date: "2026-02-10", note: "First attempt", comments: [] },
        { minutes: 55, type: "mannequin", date: "2026-02-17", note: "Better blending", comments: [
          { from: "educator", text: "Watch elevation at the crown — you're over-directing", ts: "2026-02-17T14:30:00", name: "Admin" },
          { from: "trainee", text: "Got it, I'll focus on keeping the elevation consistent next time", ts: "2026-02-17T15:10:00", name: "Cheyenne" },
        ]},
        { minutes: 52, type: "model", date: "2026-02-24", note: "First live cut", comments: [
          { from: "educator", text: "Great consultation. Tension was inconsistent on the left side", ts: "2026-02-24T16:00:00", name: "Admin" },
        ]},
        { minutes: 48, type: "model", date: "2026-03-03", note: "Feeling confident", comments: [] },
      ],
      sk2: [
        { minutes: 60, type: "mannequin", date: "2026-02-12", note: "", comments: [] },
        { minutes: 50, type: "mannequin", date: "2026-02-20", note: "Lob went well", comments: [
          { from: "educator", text: "Weight line is clean. Try graduating the back next time", ts: "2026-02-20T13:45:00", name: "Admin" },
          { from: "trainee", text: "Will do! Should I keep the same length or go shorter?", ts: "2026-02-20T14:20:00", name: "Cheyenne" },
          { from: "educator", text: "Keep the same length for now, focus on the graduation technique", ts: "2026-02-20T14:35:00", name: "Admin" },
        ]},
      ],
      sk9: [
        { minutes: 72, type: "mannequin", date: "2026-02-15", note: "", comments: [] },
        { minutes: 65, type: "model", date: "2026-02-28", note: "Root touch-up", comments: [] },
      ],
    },
  },
  {
    id: "r2",
    name: "Aisha Williams",
    cohort: "Spring 2026",
    email: "aisha@flowecollective.com",
    onboarding: {
      agreement: { signed: true, date: "2026-01-03", url: "" },
      enrollment: { completed: true, date: "2026-01-10", plan: "full" },
      gusto: { completed: true, date: "2026-01-06", fields: { legalName: "Aisha Williams", ssn: "***-**-5678", dob: "1999-03-22", address: "1800 S Congress Ave, Austin TX 78704", phone: "(512) 555-0283", emergencyName: "Fatima Williams", emergencyPhone: "(512) 555-0291", bankRouting: "***3301", bankAccount: "***4456" } },
    },
    skillIds: ["sk8", "sk9", "sk10", "sk11", "sk12", "sk13", "sk14", "sk19", "sk20"],
    progress: { sk8: {done:true}, sk9: {technique:2,timing:1}, sk14: {done:true} },
    tuition: { plan: "full", total: 4500, payments: [
      { id: "pay3", amount: 4500, date: "2026-01-10", note: "Paid in full" },
    ]},
    timingLogs: {
      sk9: [
        { minutes: 80, type: "mannequin", date: "2026-02-08", note: "First time mixing color", comments: [
          { from: "educator", text: "Good instincts on the formula. Watch your saturation — you went a half-level too warm", ts: "2026-02-08T15:00:00", name: "Admin" },
          { from: "trainee", text: "Noted! Should I add more ash next time?", ts: "2026-02-08T15:30:00", name: "Aisha" },
          { from: "educator", text: "Yes, try adding 1/4 oz of ash to neutralize. We'll check it on your next model", ts: "2026-02-08T16:00:00", name: "Admin" },
        ]},
        { minutes: 70, type: "mannequin", date: "2026-02-18", note: "Practiced balayage placement", comments: [
          { from: "educator", text: "Placement is improving. Keep your sections thinner near the face — that's where the eye goes first", ts: "2026-02-18T14:15:00", name: "Admin" },
        ]},
        { minutes: 60, type: "model", date: "2026-03-01", note: "Live balayage — client loved it!", comments: [
          { from: "educator", text: "Beautiful result. Processing time was right on. You're ready to move to timing stage 2", ts: "2026-03-01T17:00:00", name: "Admin" },
          { from: "trainee", text: "Thank you! That means a lot. Feeling more confident with each one", ts: "2026-03-01T17:20:00", name: "Aisha" },
        ]},
      ],
    },
  },
  {
    id: "r3",
    name: "Jasmine Reyes",
    cohort: "Spring 2026",
    email: "jasmine@flowecollective.com",
    onboarding: {
      agreement: { signed: true, date: "2026-01-12", url: "" },
      enrollment: { completed: true, date: "2026-01-15", plan: "monthly" },
      gusto: { completed: false, date: null, fields: {} },
    },
    skillIds: ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk15", "sk16", "sk17", "sk19"],
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:2}, sk3: {technique:1,timing:0} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay4", amount: 1650, date: "2026-01-15", note: "Month 1" },
    ]},
    timingLogs: {
      sk1: [
        { minutes: 70, type: "mannequin", date: "2026-01-28", note: "Working on my layering", comments: [] },
        { minutes: 58, type: "mannequin", date: "2026-02-05", note: "Faster this time", comments: [
          { from: "educator", text: "Speed is coming along nicely. Don't sacrifice your guide for speed though — I noticed some unevenness in the back", ts: "2026-02-05T13:45:00", name: "Admin" },
          { from: "trainee", text: "Yeah I rushed the back sections. I'll slow down there next time", ts: "2026-02-05T14:00:00", name: "Jasmine" },
        ]},
      ],
      sk2: [
        { minutes: 65, type: "mannequin", date: "2026-02-14", note: "Practiced bobs", comments: [
          { from: "educator", text: "Your perimeter is really clean. Start working on interior texture next — try point cutting into the ends", ts: "2026-02-14T16:30:00", name: "Admin" },
        ]},
        { minutes: 55, type: "model", date: "2026-02-28", note: "First live bob", comments: [
          { from: "educator", text: "Client was happy — great job keeping her calm during the consultation. One thing: check both sides in the mirror before finishing", ts: "2026-02-28T18:00:00", name: "Admin" },
          { from: "trainee", text: "I was so nervous I forgot the mirror check! Won't happen again", ts: "2026-02-28T18:15:00", name: "Jasmine" },
          { from: "educator", text: "Nerves are normal. You handled it well. Next time just pause before the blow-dry and do your check", ts: "2026-02-28T18:25:00", name: "Admin" },
        ]},
      ],
      sk3: [
        { minutes: 75, type: "mannequin", date: "2026-03-05", note: "Starting texturizing techniques", comments: [
          { from: "educator", text: "Good first attempt. Your razor angle needs work — hold it flatter to the strand or you'll get choppy ends", ts: "2026-03-05T15:00:00", name: "Admin" },
        ]},
      ],
    },
  },
  {
    id: "r4",
    name: "Zara Mitchell",
    cohort: "Spring 2026",
    email: "zara@flowecollective.com",
    onboarding: {
      agreement: { signed: true, date: "2026-01-08", url: "" },
      enrollment: { completed: true, date: "2026-01-15", plan: "monthly" },
      gusto: { completed: true, date: "2026-01-10", fields: { legalName: "Zara Mitchell", ssn: "***-**-9012", dob: "1997-11-03", address: "2200 E 6th St, Austin TX 78702", phone: "(512) 555-0344", emergencyName: "Keisha Mitchell", emergencyPhone: "(512) 555-0355", bankRouting: "***7712", bankAccount: "***2233" } },
    },
    skillIds: ["sk1", "sk2", "sk9", "sk15", "sk19", "sk23", "sk27", "sk28"],
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:3}, sk9: {technique:3,timing:3}, sk15: {technique:3,timing:3}, sk19: {done:true}, sk23: {done:true}, sk27: {done:true}, sk28: {done:true} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay5", amount: 1650, date: "2026-01-15", note: "Month 1" },
      { id: "pay6", amount: 1650, date: "2026-02-15", note: "Month 2" },
      { id: "pay7", amount: 1650, date: "2026-03-15", note: "Month 3" },
    ]},
    timingLogs: {
      sk1: [
        { minutes: 62, type: "mannequin", date: "2026-01-20", note: "Review session", comments: [] },
        { minutes: 45, type: "model", date: "2026-02-03", note: "Quick trim on live model", comments: [
          { from: "educator", text: "Excellent speed and precision. You're consistently under target time now", ts: "2026-02-03T12:00:00", name: "Admin" },
          { from: "trainee", text: "Thanks! The repetition is really paying off", ts: "2026-02-03T12:15:00", name: "Zara" },
        ]},
      ],
      sk2: [
        { minutes: 50, type: "model", date: "2026-02-10", note: "Textured lob", comments: [
          { from: "educator", text: "Flawless execution. This is assessment-ready work", ts: "2026-02-10T14:00:00", name: "Admin" },
        ]},
      ],
      sk9: [
        { minutes: 85, type: "mannequin", date: "2026-01-25", note: "Full highlight foil practice", comments: [
          { from: "educator", text: "Your foil placement is meticulous. Try to work a bit faster — aim for under 75 min next time", ts: "2026-01-25T16:30:00", name: "Admin" },
          { from: "trainee", text: "I'll time myself and try to shave 10 min off", ts: "2026-01-25T17:00:00", name: "Zara" },
        ]},
        { minutes: 72, type: "model", date: "2026-02-15", note: "Full highlight on client", comments: [
          { from: "educator", text: "72 min — great improvement! Blending at the root is seamless. Ready for timing stage 3", ts: "2026-02-15T18:00:00", name: "Admin" },
          { from: "trainee", text: "Yes!! That's a 13 min improvement. Feeling really good about color now", ts: "2026-02-15T18:10:00", name: "Zara" },
          { from: "educator", text: "You should — this is some of the best foilwork I've seen from a resident at this stage", ts: "2026-02-15T18:20:00", name: "Admin" },
        ]},
      ],
      sk15: [
        { minutes: 30, type: "mannequin", date: "2026-02-20", note: "Blowout technique practice", comments: [
          { from: "educator", text: "Smooth finish. Work on your round brush tension at the mid-lengths — you're losing some volume there", ts: "2026-02-20T11:00:00", name: "Admin" },
        ]},
      ],
    },
  },
];
