import { T } from "../../theme";
import { useData } from "../../context";
import { SectionTitle, Card } from "../../components/ui";
import { useCalendar } from "../../components/calendar/useCalendar";
import { MonthGrid } from "../../components/calendar/MonthGrid";
import { CalendarHeader } from "../../components/calendar/CalendarHeader";
import { DayEventList } from "../../components/calendar/DayEventList";

export const TraineeSchedule = ({ user }) => {
  const { schedule, gcalEvents, residents } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const cal = useCalendar(2026, 2);

  const mySchedule = schedule.filter(
    (e) => e.assignTo === "all" || e.assignTo === me.id
  );

  return (
    <div className="fade-up">
      <SectionTitle sub="View your upcoming training sessions">
        My Schedule
      </SectionTitle>

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <CalendarHeader cal={cal} />
        <MonthGrid
          cal={cal}
          schedule={mySchedule}
          gcalEvents={gcalEvents}
          onDayClick={(date) => cal.setSelectedDate(date === cal.selectedDate ? null : date)}
        />
      </Card>

      <DayEventList
        date={cal.selectedDate}
        schedule={mySchedule}
        gcalEvents={gcalEvents}
      />
    </div>
  );
};
