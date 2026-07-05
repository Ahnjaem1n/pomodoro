class TodoList {
    constructor() {
        this.todos = Storage.getTodos() || [];
        this.activeTab = 'pending';
        
        this.listContainer = document.getElementById('todo-list-items');
        this.inputElement = document.getElementById('todo-input');
        this.btnAddTodo = document.getElementById('btn-add-todo');
        this.tabs = document.querySelectorAll('#todo-panel .todo-tab');
        this.progressRing = document.getElementById('todo-progress-ring');
        this.progressText = document.getElementById('todo-progress-text');
        
        this.draggedItem = null;
        
        this.bindEvents();
        this.render();
    }
    
    bindEvents() {
        const tabsContainer = document.querySelector('#todo-panel .todo-tabs');
        
        // Tab switching (entire container acts as a toggle)
        if (tabsContainer) {
            tabsContainer.style.cursor = 'pointer';
            tabsContainer.addEventListener('click', () => {
                this.activeTab = this.activeTab === 'pending' ? 'completed' : 'pending';
                
                this.tabs.forEach(t => {
                    t.classList.toggle('active', t.dataset.tab === this.activeTab);
                });
                
                tabsContainer.dataset.active = this.activeTab;
                
                // Reset input state when switching tabs
                this.inputElement.style.display = 'none';
                if (this.btnAddTodo) {
                    this.btnAddTodo.style.display = this.activeTab === 'pending' ? 'flex' : 'none';
                }
                
                this.render();
            });
            
            // Prevent child buttons from interfering or keeping focus unnecessarily
            this.tabs.forEach(tab => {
                tab.style.pointerEvents = 'none';
            });
        }
        
        // Add button click
        if (this.btnAddTodo) {
            this.btnAddTodo.addEventListener('click', () => {
                this.btnAddTodo.style.display = 'none';
                this.inputElement.style.display = 'block';
                this.inputElement.focus();
            });
        }
        
        // Input enter key or blur
        const submitInput = () => {
            if (this.inputElement.value.trim() !== '') {
                this.addTodo(this.inputElement.value.trim());
                this.inputElement.value = '';
            }
            this.inputElement.style.display = 'none';
            this.btnAddTodo.style.display = 'flex';
        };

        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitInput();
        });
        
        this.inputElement.addEventListener('blur', () => {
            // Delay blur slightly so click on other elements works
            setTimeout(() => {
                this.inputElement.style.display = 'none';
                this.btnAddTodo.style.display = 'flex';
            }, 150);
        });
        
        // Delegation for dynamically created items
        this.listContainer.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.todo-item');
            if (!itemEl) return;
            
            const id = itemEl.dataset.id;
            
            if (e.target.closest('.todo-checkbox') || e.target.closest('.todo-text')) {
                // Toggle completion with animation if going to completed
                if (this.activeTab === 'pending') {
                    const checkbox = itemEl.querySelector('.todo-checkbox');
                    if (checkbox) checkbox.classList.add('checked');
                    
                    setTimeout(() => {
                        itemEl.classList.add('shrinking');
                        setTimeout(() => this.toggleTodo(id), 400); // Wait for full 400ms CSS transition
                    }, 150); // small delay to see the checkmark
                } else {
                    this.toggleTodo(id);
                }
            } else if (e.target.closest('.btn-restore')) {
                this.toggleTodo(id); // restore is same as toggle
            } else if (e.target.closest('.btn-delete')) {
                this.deleteTodo(id);
            }
        });
        
        // Drag and drop logic
        this.listContainer.addEventListener('mousedown', (e) => {
            if (e.target.closest('.drag-handle')) {
                const itemEl = e.target.closest('.todo-item');
                if (itemEl) itemEl.setAttribute('draggable', 'true');
            }
        });

        this.listContainer.addEventListener('mouseup', (e) => {
            const itemEl = e.target.closest('.todo-item');
            if (itemEl && itemEl.hasAttribute('draggable')) {
                itemEl.removeAttribute('draggable');
            }
        });
        
        this.listContainer.addEventListener('dragstart', (e) => {
            const itemEl = e.target.closest('.todo-item');
            if (!itemEl || this.activeTab !== 'pending') return;
            
            this.draggedItem = itemEl;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', itemEl.dataset.id);
            
            setTimeout(() => itemEl.classList.add('dragging'), 0);
        });

        this.listContainer.addEventListener('dragend', (e) => {
            const itemEl = e.target.closest('.todo-item');
            if (itemEl) {
                itemEl.classList.remove('dragging');
                itemEl.removeAttribute('draggable'); // Clean up
            }
            this.draggedItem = null;
            document.querySelectorAll('.todo-item').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });

        this.listContainer.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            const itemEl = e.target.closest('.todo-item');
            if (!itemEl || !this.draggedItem || this.draggedItem === itemEl) return;

            const bounding = itemEl.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            
            if (e.clientY > offset) {
                itemEl.classList.add('drag-over-bottom');
                itemEl.classList.remove('drag-over-top');
            } else {
                itemEl.classList.add('drag-over-top');
                itemEl.classList.remove('drag-over-bottom');
            }
        });

        this.listContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const itemEl = e.target.closest('.todo-item');
            
            document.querySelectorAll('.todo-item').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            if (!itemEl || !this.draggedItem || this.draggedItem === itemEl) return;

            const draggedId = this.draggedItem.dataset.id;
            const targetId = itemEl.dataset.id;
            
            const bounding = itemEl.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            const insertAfter = e.clientY > offset;

            this.reorderTodos(draggedId, targetId, insertAfter);
        });
    }
    
    addTodo(text) {
        const newTodo = {
            id: Date.now().toString(),
            text: text,
            completed: false
        };
        this.todos.push(newTodo);
        this.saveAndRender();
        
        // If we add while on completed tab, switch back to pending to see it
        if (this.activeTab === 'completed') {
            document.querySelector('.todo-tab[data-tab="pending"]').click();
        }
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveAndRender();
        }
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveAndRender();
    }
    
    saveAndRender() {
        Storage.saveTodos(this.todos);
        this.render();
    }
    
    reorderTodos(draggedId, targetId, insertAfter) {
        const draggedIndex = this.todos.findIndex(t => t.id === draggedId);
        const targetIndex = this.todos.findIndex(t => t.id === targetId);
        
        if (draggedIndex < 0 || targetIndex < 0) return;
        
        const [draggedItem] = this.todos.splice(draggedIndex, 1);
        
        const newTargetIndex = this.todos.findIndex(t => t.id === targetId);
        const insertIndex = insertAfter ? newTargetIndex + 1 : newTargetIndex;
        
        this.todos.splice(insertIndex, 0, draggedItem);
        this.animateReorder();
    }
    
    animateReorder() {
        const oldPositions = {};
        document.querySelectorAll('.todo-item').forEach(el => {
            oldPositions[el.dataset.id] = el.getBoundingClientRect().top;
        });
        
        Storage.saveTodos(this.todos);
        this.render();
        
        const newElements = document.querySelectorAll('.todo-item');
        
        newElements.forEach(el => {
            const id = el.dataset.id;
            const oldTop = oldPositions[id];
            if (oldTop !== undefined) {
                const newTop = el.getBoundingClientRect().top;
                const deltaY = oldTop - newTop;
                
                if (deltaY !== 0) {
                    el.style.transform = `translateY(${deltaY}px)`;
                    el.style.transition = 'none';
                }
            }
        });
        
        requestAnimationFrame(() => {
            newElements.forEach(el => {
                if (el.style.transform) {
                    el.offsetHeight; // force reflow
                    el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    el.style.transform = '';
                    
                    setTimeout(() => {
                        el.style.transition = '';
                    }, 400);
                }
            });
        });
    }
    
    updateProgress() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        this.progressText.textContent = `${percentage}%`;
        
        // 251.3 is the circumference of r=40
        const circumference = 251.3;
        const offset = circumference - (percentage / 100) * circumference;
        if(this.progressRing) {
            this.progressRing.style.strokeDashoffset = offset;
            this.progressRing.style.transition = 'stroke-dashoffset 0.5s ease-in-out';
        }
    }
    
    render() {
        this.updateProgress();
        
        const filtered = this.todos.filter(t => 
            this.activeTab === 'pending' ? !t.completed : t.completed
        );
        
        this.listContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            this.listContainer.innerHTML = `<div class="todo-empty">No ${this.activeTab} tasks</div>`;
            return;
        }
        
        filtered.forEach(todo => {
            const item = document.createElement('div');
            item.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            item.dataset.id = todo.id;
            
            if (this.activeTab === 'pending') {
                item.innerHTML = `
                    <div class="todo-checkbox"><svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-background)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0; transition: opacity 0.2s;"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <div class="todo-text-container">
                        <div class="todo-text">${todo.text}</div>
                    </div>
                    <div class="drag-handle" title="Drag to reorder">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="4" y1="9" x2="20" y2="9"></line>
                            <line x1="4" y1="15" x2="20" y2="15"></line>
                        </svg>
                    </div>
                `;
            } else {
                item.innerHTML = `
                    <div class="todo-checkbox checked">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-background)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="todo-text-container">
                        <div class="todo-text" style="text-decoration: line-through; opacity: 0.5;">${todo.text}</div>
                    </div>
                    <div class="todo-actions">
                        <button class="btn-restore" title="Restore">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                        </button>
                        <button class="btn-delete" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                `;
            }
            
            this.listContainer.appendChild(item);
        });
    }
}
