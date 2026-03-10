import { useState } from "react";
import { Ctx } from "./context";
import { GlobalStyle } from "./styles";
import { T } from "./theme";
import { MASTER_PROGRAM } from "./data/masterProgram";
import { INIT_PRESETS } from "./data/presets";
import { INIT_RESIDENTS } from "./data/residents";
import { INIT_SCHEDULE } from "./data/schedule";
import { INIT_DOCS } from "./data/docs";
import { INIT_MESSAGES } from "./data/messages";
import { Toast } from "./components/ui";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileHeader } from "./components/layout/MobileHeader";
import { AuthScreen } from "./components/auth/AuthScreen";
import { TraineeDash } from "./pages/trainee/TraineeDash";
import { TraineeSchedule } from "./pages/trainee/TraineeSchedule";
import { TraineeSkills } from "./pages/trainee/TraineeSkills";
import { TraineeTuition } from "./pages/trainee/TraineeTuition";
import { HandbookPage } from "./pages/trainee/HandbookPage";
import { TraineeDocs } from "./pages/trainee/TraineeDocs";
import { FloatingTimer } from "./pages/trainee/FloatingTimer";
import { AdminDash } from "./pages/admin/AdminDash";
import { AdminSchedule } from "./pages/admin/AdminSchedule";
import { AdminMaster } from "./pages/admin/AdminMaster";
import { AdminPresets } from "./pages/admin/AdminPresets";
import { AdminTrainees } from "./pages/admin/AdminTrainees";
import { TraineeProfile } from "./pages/admin/TraineeProfile";
import { AdminDocs } from "./pages/admin/AdminDocs";
import { AdminTuition } from "./pages/admin/AdminTuition";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { MsgPage } from "./pages/shared/MsgPage";

const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dash");
  const [masterProgram, setMasterProgram] = useState(MASTER_PROGRAM);
  const [presets, setPresets] = useState(INIT_PRESETS);
  const [residents, setResidents] = useState(INIT_RESIDENTS);
  const [schedule, setSchedule] = useState(INIT_SCHEDULE);
  const [docs, setDocs] = useState(INIT_DOCS);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 2500);
  };

  const handleLogin = (u) => {
    setUser(u);
    setPage(u.role === "admin" ? "a-dash" : "dash");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("dash");
  };

  if (!user) {
    return (
      <>
        <GlobalStyle />
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  const data = {
    masterProgram,
    setMasterProgram,
    presets,
    setPresets,
    residents,
    setResidents,
    schedule,
    setSchedule,
    docs,
    setDocs,
    messages,
    setMessages,
    gcalConnected,
    setGcalConnected,
    gcalEvents,
    setGcalEvents,
    showToast,
  };

  const pageMap = {
    dash: <TraineeDash user={user} />,
    sched: <TraineeSchedule user={user} />,
    skills: <TraineeSkills user={user} />,
    tuition: <TraineeTuition user={user} />,
    handbook: <HandbookPage user={user} />,
    docs: <TraineeDocs user={user} />,
    msg: <MsgPage user={user} />,
    "a-dash": <AdminDash />,
    "a-sched": <AdminSchedule />,
    "a-master": <AdminMaster />,
    "a-presets": <AdminPresets />,
    "a-trainees": <AdminTrainees onNav={setPage} />,
    "a-tuition": <AdminTuition />,
    "a-docs": <AdminDocs />,
    "a-msg": <MsgPage user={user} />,
    "a-settings": <SettingsPage />,
  };

  const renderPage = () => {
    if (page.startsWith("a-trainees:")) {
      const id = page.split(":")[1];
      return <TraineeProfile residentId={id} onNav={setPage} />;
    }
    return pageMap[page] || <TraineeDash user={user} />;
  };

  return (
    <Ctx.Provider value={data}>
      <GlobalStyle />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          user={user}
          page={page}
          onNav={setPage}
          onLogout={handleLogout}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="app-main" style={{ flex: 1, marginLeft: 240, minHeight: "100vh" }}>
          <MobileHeader user={user} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
          <main style={{ padding: "28px 32px", maxWidth: 1100 }}>
            {renderPage()}
          </main>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
      {user.role !== "admin" && <FloatingTimer user={user} onNav={setPage} />}
    </Ctx.Provider>
  );
};

export default App;
