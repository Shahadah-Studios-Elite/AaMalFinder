interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface UserProfile {
  isSetup: boolean;
  name: string;
  city: string;
  dept: string;
  uni: string;
  prayers: PrayerTimes;
}

interface RoutineItem {
  id: string;
  title: string;
  category: 'ibadat' | 'class' | 'study' | 'life';
  startTime: string;
  endTime: string;
  location: string;
  days: number[];
}

interface TodoItem {
  id: string;
  text: string;
  priority: 'normal' | 'high';
  done: boolean;
  date: string;
}

interface AcademicItem {
  id: string;
  type: 'exam' | 'assignment';
  course: string;
  title: string;
  date: string;
  time: string;
  room: string;
  completed: boolean;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

interface DailyLog {
  prayersDone: Record<string, boolean>;
  routinesDone: Record<string, boolean>;
}

interface AppState {
  profile: UserProfile;
  routines: RoutineItem[];
  todos: TodoItem[];
  academics: AcademicItem[];
  events: EventItem[];
  logs: Record<string, DailyLog>;
}

const STORAGE_KEY = 'aamalfinder_data_v1';

class AamalFinderApp {
  private state: AppState;
  private selectedDate: Date = new Date();
  private routineFilter: string = 'all';

  constructor() {
    this.state = this.loadState();
    this.init();
  }

  private getDefaultState(): AppState {
    return {
      profile: {
        isSetup: false,
        name: '',
        city: '',
        dept: '',
        uni: '',
        prayers: {
          Fajr: '05:50',
          Dhuhr: '13:10',
          Asr: '16:20',
          Maghrib: '19:10',
          Isha: '20:20'
        }
      },
      routines: [],
      todos: [],
      academics: [],
      events: [],
      logs: {}
    };
  }

  private loadState(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getDefaultState();
      return { ...this.getDefaultState(), ...JSON.parse(raw) };
    } catch {
      return this.getDefaultState();
    }
  }

  private saveState(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.renderAll();
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDailyLog(dateKey: string): DailyLog {
    if (!this.state.logs[dateKey]) {
      this.state.logs[dateKey] = { prayersDone: {}, routinesDone: {} };
    }
    return this.state.logs[dateKey];
  }

  private init(): void {
    this.bindNavigation();
    this.bindForms();
    this.bindActions();

    if (!this.state.profile.isSetup) {
      document.getElementById('setup-modal')?.classList.remove('hidden');
    }
    this.renderAll();
  }

  private bindNavigation(): void {
    const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = `tab-${btn.dataset.tab}`;
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    document.getElementById('go-to-plan-btn')?.addEventListener('click', () => {
      document.querySelector<HTMLButtonElement>('[data-tab="plan"]')?.click();
    });

    document.getElementById('prev-day')?.addEventListener('click', () => {
      this.selectedDate.setDate(this.selectedDate.getDate() - 1);
      this.renderToday();
    });

    document.getElementById('next-day')?.addEventListener('click', () => {
      this.selectedDate.setDate(this.selectedDate.getDate() + 1);
      this.renderToday();
    });
  }

  private bindForms(): void {
    document.getElementById('setup-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.profile = {
        isSetup: true,
        name: (document.getElementById('setup-name') as HTMLInputElement).value.trim(),
        city: (document.getElementById('setup-city') as HTMLInputElement).value.trim(),
        dept: (document.getElementById('setup-dept') as HTMLInputElement).value.trim(),
        uni: (document.getElementById('setup-uni') as HTMLInputElement).value.trim(),
        prayers: {
          Fajr: (document.getElementById('setup-fajr') as HTMLInputElement).value,
          Dhuhr: (document.getElementById('setup-dhuhr') as HTMLInputElement).value,
          Asr: (document.getElementById('setup-asr') as HTMLInputElement).value,
          Maghrib: (document.getElementById('setup-maghrib') as HTMLInputElement).value,
          Isha: (document.getElementById('setup-isha') as HTMLInputElement).value,
        }
      };

      const allDays: number[] = [0, 1, 2, 3, 4, 5, 6];
      if ((document.getElementById('preset-quran') as HTMLInputElement).checked) {
        this.state.routines.push({
          id: crypto.randomUUID(),
          title: 'Quran Tilawat (After Fajr)',
          category: 'ibadat',
          startTime: '06:15',
          endTime: '06:45',
          location: '',
          days: allDays
        });
      }
      if ((document.getElementById('preset-study') as HTMLInputElement).checked) {
        this.state.routines.push({
          id: crypto.randomUUID(),
          title: 'Night Study Session',
          category: 'study',
          startTime: '20:00',
          endTime: '22:00',
          location: '',
          days: allDays
        });
      }
      if ((document.getElementById('preset-sleep') as HTMLInputElement).checked) {
        this.state.routines.push({
          id: crypto.randomUUID(),
          title: 'Sleep',
          category: 'life',
          startTime: '23:00',
          endTime: '',
          location: '',
          days: allDays
        });
      }

      document.getElementById('setup-modal')?.classList.add('hidden');
      this.saveState();
    });

    document.getElementById('quick-todo-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('quick-todo-input') as HTMLInputElement;
      const prio = (document.getElementById('quick-todo-priority') as HTMLSelectElement).value as 'normal' | 'high';
      if (!input.value.trim()) return;

      this.state.todos.push({
        id: crypto.randomUUID(),
        text: input.value.trim(),
        priority: prio,
        done: false,
        date: this.formatDateKey(this.selectedDate)
      });
      input.value = '';
      this.saveState();
    });

    document.getElementById('routine-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (document.getElementById('routine-title') as HTMLInputElement).value.trim();
      const category = (document.getElementById('routine-category') as HTMLSelectElement).value as RoutineItem['category'];
      const startTime = (document.getElementById('routine-start') as HTMLInputElement).value;
      const endTime = (document.getElementById('routine-end') as HTMLInputElement).value;
      const location = (document.getElementById('routine-location') as HTMLInputElement).value.trim();

      const dayCheckboxes = document.querySelectorAll<HTMLInputElement>('#routine-days input:checked');
      const days = Array.from(dayCheckboxes).map(cb => Number(cb.value));

      if (!title || days.length === 0) return;

      this.state.routines.push({
        id: crypto.randomUUID(),
        title,
        category,
        startTime,
        endTime,
        location,
        days
      });

      (e.target as HTMLFormElement).reset();
      this.saveState();
    });

    document.getElementById('academic-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.academics.push({
        id: crypto.randomUUID(),
        type: (document.getElementById('acad-type') as HTMLSelectElement).value as 'exam' | 'assignment',
        course: (document.getElementById('acad-course') as HTMLInputElement).value.trim(),
        title: (document.getElementById('acad-title') as HTMLInputElement).value.trim(),
        date: (document.getElementById('acad-date') as HTMLInputElement).value,
        time: (document.getElementById('acad-time') as HTMLInputElement).value,
        room: (document.getElementById('acad-room') as HTMLInputElement).value.trim(),
        completed: false
      });
      (e.target as HTMLFormElement).reset();
      this.saveState();
    });

    document.getElementById('event-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.events.push({
        id: crypto.randomUUID(),
        title: (document.getElementById('event-title') as HTMLInputElement).value.trim(),
        date: (document.getElementById('event-date') as HTMLInputElement).value,
        time: (document.getElementById('event-time') as HTMLInputElement).value,
        location: (document.getElementById('event-location') as HTMLInputElement).value.trim()
      });
      (e.target as HTMLFormElement).reset();
      this.saveState();
    });

    document.getElementById('settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.profile.name = (document.getElementById('set-name') as HTMLInputElement).value.trim();
      this.state.profile.city = (document.getElementById('set-city') as HTMLInputElement).value.trim();
      this.state.profile.dept = (document.getElementById('set-dept') as HTMLInputElement).value.trim();
      this.state.profile.uni = (document.getElementById('set-uni') as HTMLInputElement).value.trim();
      this.state.profile.prayers = {
        Fajr: (document.getElementById('set-fajr') as HTMLInputElement).value,
        Dhuhr: (document.getElementById('set-dhuhr') as HTMLInputElement).value,
        Asr: (document.getElementById('set-asr') as HTMLInputElement).value,
        Maghrib: (document.getElementById('set-maghrib') as HTMLInputElement).value,
        Isha: (document.getElementById('set-isha') as HTMLInputElement).value,
      };
      this.saveState();
      alert('Settings saved successfully!');
    });
  }

  private bindActions(): void {
    document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.routineFilter = btn.dataset.filter || 'all';
        this.renderRoutines();
      });
    });

    document.getElementById('export-json-btn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
      this.downloadBlob(blob, `aamalfinder-backup-${this.formatDateKey(new Date())}.json`);
    });

    document.getElementById('import-json-input')?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          this.state = { ...this.getDefaultState(), ...parsed };
          this.saveState();
          alert('Backup restored successfully!');
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('export-ics-btn')?.addEventListener('click', () => {
      let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AamalFinder//EN\n';
      const todayStr = this.formatDateKey(new Date()).replace(/-/g, '');
      
      this.state.routines.forEach(r => {
        const start = r.startTime.replace(':', '') + '00';
        const end = (r.endTime || r.startTime).replace(':', '') + '00';
        ics += `BEGIN:VEVENT\nSUMMARY:${r.title}\nDTSTART:${todayStr}T${start}\nDTEND:${todayStr}T${end}\nLOCATION:${r.location}\nEND:VEVENT\n`;
      });
      ics += 'END:VCALENDAR';

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      this.downloadBlob(blob, 'aamalfinder-routine.ics');
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private renderAll(): void {
    this.renderHeader();
    this.renderToday();
    this.renderRoutines();
    this.renderAcademics();
    this.renderEvents();
    this.renderSettings();
  }

  private renderHeader(): void {
    const greetingEl = document.getElementById('header-greeting');
    if (greetingEl && this.state.profile.name) {
      greetingEl.textContent = `Assalamu Alaikum, ${this.state.profile.name} (${this.state.profile.city})`;
    }
  }

  private renderToday(): void {
    const dateKey = this.formatDateKey(this.selectedDate);
    const dayOfWeek = this.selectedDate.getDay();
    const log = this.getDailyLog(dateKey);

    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
      dateDisplay.textContent = this.selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
    }

    const prayerListEl = document.getElementById('prayer-list');
    let prayersCompleted = 0;
    if (prayerListEl) {
      prayerListEl.innerHTML = '';
      (Object.entries(this.state.profile.prayers) as [keyof PrayerTimes, string][]).forEach(([name, time]) => {
        const isDone = !!log.prayersDone[name];
        if (isDone) prayersCompleted++;

        const div = document.createElement('div');
        div.className = `check-item ${isDone ? 'done' : ''}`;
        div.innerHTML = `
          <label class="check-left">
            <input type="checkbox" ${isDone ? 'checked' : ''} />
            <span><strong>${name}</strong></span>
          </label>
          <span class="badge">${time}</span>
        `;
        div.querySelector('input')?.addEventListener('change', (e) => {
          log.prayersDone[name] = (e.target as HTMLInputElement).checked;
          this.saveState();
        });
        prayerListEl.appendChild(div);
      });
    }

    const todayRoutines = this.state.routines
      .filter(r => r.days.includes(dayOfWeek))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const routineListEl = document.getElementById('today-routine-list');
    let routinesCompleted = 0;
    if (routineListEl) {
      routineListEl.innerHTML = todayRoutines.length === 0 ? '<p class="muted">No routines scheduled for this day.</p>' : '';
      todayRoutines.forEach(r => {
        const isDone = !!log.routinesDone[r.id];
        if (isDone) routinesCompleted++;

        const div = document.createElement('div');
        div.className = `check-item ${isDone ? 'done' : ''}`;
        div.innerHTML = `
          <label class="check-left">
            <input type="checkbox" ${isDone ? 'checked' : ''} />
            <span>${r.title}</span>
          </label>
          <span class="badge">${r.startTime}${r.endTime ? ' - ' + r.endTime : ''}</span>
        `;
        div.querySelector('input')?.addEventListener('change', (e) => {
          log.routinesDone[r.id] = (e.target as HTMLInputElement).checked;
          this.saveState();
        });
        routineListEl.appendChild(div);
      });
    }

    const todayTodos = this.state.todos.filter(t => t.date === dateKey);
    const todoListEl = document.getElementById('today-todo-list');
    let todosCompleted = 0;
    if (todoListEl) {
      todoListEl.innerHTML = todayTodos.length === 0 ? '<p class="muted">No To-Do tasks for this day.</p>' : '';
      todayTodos.forEach(t => {
        if (t.done) todosCompleted++;
        const div = document.createElement('div');
        div.className = `check-item ${t.done ? 'done' : ''} ${t.priority === 'high' ? 'high-priority' : ''}`;
        div.innerHTML = `
          <label class="check-left">
            <input type="checkbox" ${t.done ? 'checked' : ''} />
            <span>${t.text}</span>
          </label>
          <button class="btn small danger" aria-label="Delete">✕</button>
        `;
        div.querySelector('input')?.addEventListener('change', (e) => {
          t.done = (e.target as HTMLInputElement).checked;
          this.saveState();
        });
        div.querySelector('button')?.addEventListener('click', () => {
          this.state.todos = this.state.todos.filter(item => item.id !== t.id);
          this.saveState();
        });
        todoListEl.appendChild(div);
      });
    }

    const totalTasks = 5 + todayRoutines.length + todayTodos.length;
    const totalDone = prayersCompleted + routinesCompleted + todosCompleted;
    const percent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

    document.getElementById('total-percent')!.textContent = `${percent}%`;
    (document.getElementById('total-progress-bar') as HTMLElement).style.width = `${percent}%`;
    document.getElementById('stat-prayers')!.textContent = `${prayersCompleted}/5`;
    document.getElementById('stat-routine')!.textContent = `${routinesCompleted}/${todayRoutines.length}`;
    document.getElementById('stat-todo')!.textContent = `${todosCompleted}/${todayTodos.length}`;
    document.getElementById('stat-streak')!.textContent = `${this.calculateStreak()} d`;
  }

  private calculateStreak(): number {
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const key = this.formatDateKey(checkDate);
      const log = this.state.logs[key];
      if (!log) break;
      const prayersCount = Object.values(log.prayersDone).filter(Boolean).length;
      if (prayersCount >= 3) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private renderRoutines(): void {
    const listEl = document.getElementById('all-routines-list');
    if (!listEl) return;

    const filtered = this.routineFilter === 'all'
      ? this.state.routines
      : this.state.routines.filter(r => r.category === this.routineFilter);

    listEl.innerHTML = filtered.length === 0 ? '<p class="muted">No routines in this category.</p>' : '';
    filtered.forEach(r => {
      const div = document.createElement('div');
      div.className = 'check-item';
      div.innerHTML = `
        <div>
          <strong>${r.title}</strong>
          <div class="muted" style="margin:0">${r.startTime} ${r.location ? '• ' + r.location : ''}</div>
        </div>
        <button class="btn small danger">Delete</button>
      `;
      div.querySelector('button')?.addEventListener('click', () => {
        this.state.routines = this.state.routines.filter(item => item.id !== r.id);
        this.saveState();
      });
      listEl.appendChild(div);
    });
  }

  private renderAcademics(): void {
    const upcoming = this.state.academics.filter(a => !a.completed).sort((a, b) => a.date.localeCompare(b.date));
    const exams = upcoming.filter(a => a.type === 'exam');
    const assigns = upcoming.filter(a => a.type === 'assignment');

    document.getElementById('acad-exam-count')!.textContent = String(exams.length);
    document.getElementById('acad-assign-count')!.textContent = String(assigns.length);
    document.getElementById('acad-next-deadline')!.textContent = upcoming.length > 0 ? upcoming[0].date : '—';

    const listEl = document.getElementById('academic-upcoming-list');
    if (!listEl) return;

    listEl.innerHTML = upcoming.length === 0 ? '<p class="muted">No upcoming exams or assignments.</p>' : '';
    upcoming.forEach(item => {
      const div = document.createElement('div');
      div.className = 'check-item';
      div.innerHTML = `
        <div>
          <span class="badge">${item.type === 'exam' ? '📝 Exam' : '📄 Assignment'}</span>
          <strong>${item.course}: ${item.title}</strong>
          <div class="muted" style="margin:0">Date: ${item.date} ${item.time} ${item.room ? '(' + item.room + ')' : ''}</div>
        </div>
        <button class="btn small">Complete</button>
      `;
      div.querySelector('button')?.addEventListener('click', () => {
        item.completed = true;
        this.saveState();
      });
      listEl.appendChild(div);
    });
  }

  private renderEvents(): void {
    const listEl = document.getElementById('events-list');
    if (!listEl) return;

    const sorted = [...this.state.events].sort((a, b) => a.date.localeCompare(b.date));
    listEl.innerHTML = sorted.length === 0 ? '<p class="muted">No upcoming events.</p>' : '';
    sorted.forEach(ev => {
      const div = document.createElement('div');
      div.className = 'check-item';
      div.innerHTML = `
        <div>
          <strong>${ev.title}</strong>
          <div class="muted" style="margin:0">${ev.date} ${ev.time} ${ev.location ? '• ' + ev.location : ''}</div>
        </div>
        <button class="btn small danger" aria-label="Delete">✕</button>
      `;
      div.querySelector('button')?.addEventListener('click', () => {
        this.state.events = this.state.events.filter(item => item.id !== ev.id);
        this.saveState();
      });
      listEl.appendChild(div);
    });
  }

  private renderSettings(): void {
    const p = this.state.profile;
    (document.getElementById('set-name') as HTMLInputElement).value = p.name;
    (document.getElementById('set-city') as HTMLInputElement).value = p.city;
    (document.getElementById('set-dept') as HTMLInputElement).value = p.dept;
    (document.getElementById('set-uni') as HTMLInputElement).value = p.uni;
    (document.getElementById('set-fajr') as HTMLInputElement).value = p.prayers.Fajr;
    (document.getElementById('set-dhuhr') as HTMLInputElement).value = p.prayers.Dhuhr;
    (document.getElementById('set-asr') as HTMLInputElement).value = p.prayers.Asr;
    (document.getElementById('set-maghrib') as HTMLInputElement).value = p.prayers.Maghrib;
    (document.getElementById('set-isha') as HTMLInputElement).value = p.prayers.Isha;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AamalFinderApp();
});
