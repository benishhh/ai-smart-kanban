const GEMINI_API_KEY = "_TU_WSTAW_SWÓJ_KLUCZ_API_"; // ukryty klucz dla bezpieczenstwa

// ==========================================
// 1. MODEL
// ==========================================
class KanbanModel {
  constructor() {
    const savedTasks = localStorage.getItem('kanbanTasks');
    this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
  }

  addTask(text, status = 'todo') {
    const newTask = {
      // unikalne ID
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
      text: text,
      status: status
    };
    this.tasks.push(newTask);
    this.save();
    return newTask;
  }

  updateTaskStatus(id, newStatus) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = newStatus;
      this.save();
    }
  }

  // Czyszczenie starych zadań
  clearAllTasks() {
    this.tasks = [];
    this.save();
  }

  save() {
    localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
  }
}

// ==========================================
// 2. VIEW
// ==========================================
class KanbanView {
  constructor() {
    this.lists = {
      todo: document.getElementById('todo-list'),
      inprogress: document.getElementById('inprogress-list'),
      done: document.getElementById('done-list')
    };
    this.setupDragAndDrop();
  }

  renderTasks(tasks) {
    Object.values(this.lists).forEach(list => list.innerHTML = '');

    tasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = 'task';
      taskEl.draggable = true;
      taskEl.dataset.id = task.id;
      taskEl.textContent = task.text;

      taskEl.addEventListener('dragstart', () => taskEl.classList.add('dragging'));
      taskEl.addEventListener('dragend', () => taskEl.classList.remove('dragging'));

      this.lists[task.status].appendChild(taskEl);
    });
  }

  setupDragAndDrop() {
    document.querySelectorAll('.column').forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; // Podświetlenie
      });
      
      column.addEventListener('dragleave', () => {
        column.style.backgroundColor = "";
      });

      column.addEventListener('drop', () => {
        column.style.backgroundColor = "";
      });
    });
  }
}

// ==========================================
// 3. CONTROLLER
// ==========================================
class KanbanController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.view.renderTasks(this.model.tasks);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const aiBtn = document.getElementById('ai-btn');
    const aiInput = document.getElementById('ai-input');

    aiBtn.addEventListener('click', async () => {
      const goal = aiInput.value.trim();
      if (!goal) return;

      aiBtn.disabled = true;
      aiBtn.textContent = '⏳ AI myśli...';

      await this.generateWorkflowFromAI(goal);

      aiInput.value = '';
      aiBtn.disabled = false;
      aiBtn.textContent = 'Wygeneruj Workflow z AI';
    });

    document.querySelectorAll('.column').forEach(column => {
      column.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Blokuje konflikty przy puszczaniu
        const draggedTask = document.querySelector('.dragging');
        if (draggedTask) {
          const taskId = draggedTask.dataset.id;
          const newStatus = column.dataset.status;
          
          this.model.updateTaskStatus(taskId, newStatus);
          this.view.renderTasks(this.model.tasks);
        }
      });
    });
  }

  async generateWorkflowFromAI(goal) {
    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      const modelsData = await modelsRes.json();
      
      if (modelsData.error) throw new Error(`Błąd klucza API: ${modelsData.error.message}`);

      const workingModels = modelsData.models.filter(m => 
        m.supportedGenerationMethods.includes('generateContent') && 
        m.name.includes('gemini')
      );

      if (workingModels.length === 0) throw new Error("Brak dostępnych modeli tekstowych.");

      const prompt = `Jesteś Senior Tech Leadem. Rozbij ten cel na 3 do 5 konkretnych zadań programistycznych (bez żadnego formatowania, po prostu same punkty, jeden pod drugim). Cel: ${goal}`;

      let aiText = '';
      let success = false;

      for (const m of workingModels) {
        const exactModelName = m.name.replace('models/', '');
        console.log(`⏳ Próbuję połączyć z modelem: ${exactModelName}...`);
        
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${exactModelName}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          aiText = data.candidates[0].content.parts[0].text;
          console.log(`✅ SUKCES! Odpowiedział model: ${exactModelName}`);
          
          // --- NOWOŚĆ: Skoro mamy sukces, czyścimy stare zadania ---
          this.model.clearAllTasks(); 
          
          success = true;
          break; 
          
        } catch (apiError) {
          console.warn(`Model ${exactModelName} odrzucił zapytanie. Próbuję następny...`);
        }
      }

      if (!success) throw new Error("Wszystkie modele Google padły. Przeciążenie serwerów.");

      const tasks = aiText.split('\n').filter(line => line.trim().length > 0);
      
      tasks.forEach(taskStr => {
        const cleanText = taskStr.replace(/^[\*\-\d\.\s]+/, ''); 
        if (cleanText) {
          this.model.addTask(cleanText, 'todo');
        }
      });

      this.view.renderTasks(this.model.tasks);

    } catch (error) {
      alert("Błąd połączenia z AI: " + error.message);
    }
  }
}

// ==========================================
// ODPALENIE APLIKACJI
// ==========================================
const appModel = new KanbanModel();
const appView = new KanbanView();
const appController = new KanbanController(appModel, appView);