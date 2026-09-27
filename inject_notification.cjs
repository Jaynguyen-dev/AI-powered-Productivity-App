const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const insertionPoint = '  // --- CALENDAR WORKFLOWS ---';
const effectCode = `  // Background Notification Checker (6 hours before due)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkTasks = () => {
      const now = new Date();
      // Use fresh tasks from storage to avoid state stale closures
      const currentTasks = storageService.getTasks();
      let hasUpdates = false;

      const updatedTasks = currentTasks.map(task => {
        if (task.status === 'completed' || task.notified6Hours || !task.dueDate) return task;
        
        let dateStr = task.dueDate;
        if (task.dueTime) {
          dateStr += \`T\${task.dueTime}:00\`;
        } else {
          dateStr += 'T23:59:59';
        }
        
        const due = new Date(dateStr);
        if (isNaN(due.getTime())) return task;
        
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours > 0 && diffHours <= 6) {
          const title = \`Task Due Soon: \${task.title}\`;
          const body = \`Due in \${Math.round(diffHours * 10) / 10} hours\`;
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
          } else {
            addToast(title, body, 'info');
          }
          
          hasUpdates = true;
          return { ...task, notified6Hours: true };
        }
        return task;
      });

      if (hasUpdates) {
        updatedTasks.forEach(t => {
          if (t.notified6Hours && !currentTasks.find(ct => ct.id === t.id)?.notified6Hours) {
            storageService.updateTask(t);
          }
        });
        refreshAll();
      }
    };

    checkTasks();
    const interval = setInterval(checkTasks, 60000); // every minute
    return () => clearInterval(interval);
  }, [addToast, refreshAll]);

`;

if (code.includes(insertionPoint)) {
  code = code.replace(insertionPoint, effectCode + insertionPoint);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Success');
} else {
  console.log('Insertion point not found');
}
