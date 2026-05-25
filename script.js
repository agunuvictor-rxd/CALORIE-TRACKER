/* ===========================
   CaloriQ — Smart Calorie Tracker
   Vanilla JS with localStorage
   =========================== */

(function () {
    'use strict';

    // ───── Constants ─────
    const STORAGE_KEYS = {
        ENTRIES: 'caloriq_entries',
        GOAL: 'caloriq_daily_goal',
        USER_NAME: 'caloriq_user_name',
    };

    const DEFAULT_GOAL = 2000;

    // ───── State ─────
    let dailyGoal = DEFAULT_GOAL;
    let entries = [];
    let selectedCategory = 'breakfast';

    // ───── DOM References ─────
    const $ = (id) => document.getElementById(id);

    const dom = {
        // Stats
        totalConsumed: $('total-consumed'),
        totalRemaining: $('total-remaining'),
        dailyGoalDisplay: $('daily-goal-display'),
        // Progress
        progressRingFill: $('progress-ring-fill'),
        progressPercentage: $('progress-percentage'),
        // Meal items
        breakfastItems: $('breakfast-items'),
        lunchItems: $('lunch-items'),
        dinnerItems: $('dinner-items'),
        snacksItems: $('snacks-items'),
        breakfastCalories: $('breakfast-calories'),
        lunchCalories: $('lunch-calories'),
        dinnerCalories: $('dinner-calories'),
        snacksCalories: $('snacks-calories'),
        // Weekly
        weeklyChart: $('weekly-chart'),
        // History
        historyList: $('history-list'),
        emptyHistory: $('empty-history'),
        // Buttons
        btnAddMeal: $('btn-add-meal'),
        btnSettings: $('btn-settings'),
        btnClearHistory: $('btn-clear-history'),
        // Modals
        modalAddMeal: $('modal-add-meal'),
        modalSettings: $('modal-settings'),
        btnCloseAddModal: $('btn-close-add-modal'),
        btnCloseSettingsModal: $('btn-close-settings-modal'),
        // Forms
        formAddMeal: $('form-add-meal'),
        formSettings: $('form-settings'),
        inputFoodName: $('input-food-name'),
        inputCalories: $('input-calories'),
        inputProtein: $('input-protein'),
        inputCarbs: $('input-carbs'),
        inputFat: $('input-fat'),
        inputDailyGoal: $('input-daily-goal'),
        inputUserName: $('input-user-name'),
        // Misc
        dateDisplay: $('date-display'),
        toast: $('toast'),
        toastMessage: $('toast-message'),
        appHeader: $('app-header'),
    };

    // ───── Utilities ─────
    function getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }

    function formatFullDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    function animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const diff = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = Math.round(start + diff * eased);
            element.textContent = current.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    function showToast(message) {
        dom.toastMessage.textContent = message;
        dom.toast.classList.add('active');
        setTimeout(() => {
            dom.toast.classList.remove('active');
        }, 2800);
    }

    // ───── LocalStorage ─────
    function loadData() {
        try {
            const savedGoal = localStorage.getItem(STORAGE_KEYS.GOAL);
            dailyGoal = savedGoal ? parseInt(savedGoal, 10) : DEFAULT_GOAL;

            const savedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
            entries = savedEntries ? JSON.parse(savedEntries) : [];
        } catch (e) {
            console.error('Error loading data:', e);
            entries = [];
            dailyGoal = DEFAULT_GOAL;
        }
    }

    function saveEntries() {
        try {
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
        } catch (e) {
            console.error('Error saving entries:', e);
        }
    }

    function saveGoal() {
        try {
            localStorage.setItem(STORAGE_KEYS.GOAL, dailyGoal.toString());
        } catch (e) {
            console.error('Error saving goal:', e);
        }
    }

    function saveUserName(name) {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
        } catch (e) {
            console.error('Error saving name:', e);
        }
    }

    function getUserName() {
        return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    }

    // ───── Data Helpers ─────
    function getTodayEntries() {
        const today = getTodayKey();
        return entries.filter((e) => e.date === today);
    }

    function getEntriesByDate(dateKey) {
        return entries.filter((e) => e.date === dateKey);
    }

    function getTotalCaloriesToday() {
        return getTodayEntries().reduce((sum, e) => sum + e.calories, 0);
    }

    function getCategoryCaloriesToday(category) {
        return getTodayEntries()
            .filter((e) => e.category === category)
            .reduce((sum, e) => sum + e.calories, 0);
    }

    function getUniqueDates() {
        const dates = [...new Set(entries.map((e) => e.date))];
        dates.sort((a, b) => b.localeCompare(a));
        return dates;
    }

    function getLast7Days() {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    }

    // ───── Render Stats ─────
    function renderStats() {
        const consumed = getTotalCaloriesToday();
        const remaining = Math.max(0, dailyGoal - consumed);

        const prevConsumed = parseInt(dom.totalConsumed.textContent.replace(/,/g, ''), 10) || 0;
        const prevRemaining = parseInt(dom.totalRemaining.textContent.replace(/,/g, ''), 10) || 0;

        animateValue(dom.totalConsumed, prevConsumed, consumed, 600);
        animateValue(dom.totalRemaining, prevRemaining, remaining, 600);
        dom.dailyGoalDisplay.textContent = dailyGoal.toLocaleString();

        // Color remaining based on status
        const statRemainingCard = $('stat-remaining');
        if (consumed > dailyGoal) {
            dom.totalRemaining.textContent = '0';
            statRemainingCard.style.setProperty('--glow', 'rgba(239, 68, 68, 0.15)');
        }
    }

    // ───── Render Progress Ring ─────
    function renderProgressRing() {
        const consumed = getTotalCaloriesToday();
        const percentage = dailyGoal > 0 ? (consumed / dailyGoal) * 100 : 0;
        const clamped = Math.min(percentage, 100);

        const circumference = 2 * Math.PI * 85; // r = 85
        const offset = circumference - (clamped / 100) * circumference;

        dom.progressRingFill.style.strokeDasharray = circumference;
        dom.progressRingFill.style.strokeDashoffset = offset;

        if (percentage > 100) {
            dom.progressRingFill.classList.add('over');
            dom.progressPercentage.textContent = Math.round(percentage) + '%';
            dom.progressPercentage.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else {
            dom.progressRingFill.classList.remove('over');
            dom.progressPercentage.textContent = Math.round(percentage) + '%';
            dom.progressPercentage.style.background = 'linear-gradient(135deg, #f97316, #ef4444, #ec4899)';
        }

        dom.progressPercentage.style.webkitBackgroundClip = 'text';
        dom.progressPercentage.style.webkitTextFillColor = 'transparent';
        dom.progressPercentage.style.backgroundClip = 'text';
    }

    // ───── Render Meal Categories ─────
    function renderMealCategories() {
        const categories = ['breakfast', 'lunch', 'dinner', 'snacks'];
        const today = getTodayKey();

        categories.forEach((cat) => {
            const itemsContainer = dom[cat + 'Items'];
            const caloriesDisplay = dom[cat + 'Calories'];
            const catEntries = entries.filter((e) => e.date === today && e.category === cat);
            const totalCal = catEntries.reduce((sum, e) => sum + e.calories, 0);

            caloriesDisplay.textContent = totalCal + ' kcal';

            if (catEntries.length === 0) {
                itemsContainer.innerHTML = '<div class="empty-category">No entries yet</div>';
            } else {
                itemsContainer.innerHTML = catEntries
                    .map(
                        (entry) => `
                    <div class="food-item" data-id="${entry.id}">
                        <div class="food-item-info">
                            <span class="food-item-name">${escapeHtml(entry.name)}</span>
                            <span class="food-item-macros">${buildMacroString(entry)}</span>
                        </div>
                        <div class="food-item-actions">
                            <span class="food-item-calories">${entry.calories} kcal</span>
                            <button class="btn-delete-item" data-id="${entry.id}" aria-label="Delete ${escapeHtml(entry.name)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `
                    )
                    .join('');
            }
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function buildMacroString(entry) {
        const parts = [];
        if (entry.protein) parts.push('P: ' + entry.protein + 'g');
        if (entry.carbs) parts.push('C: ' + entry.carbs + 'g');
        if (entry.fat) parts.push('F: ' + entry.fat + 'g');
        return parts.length > 0 ? parts.join(' · ') : '';
    }

    // ───── Render Weekly Chart ─────
    function renderWeeklyChart() {
        const days = getLast7Days();
        const today = getTodayKey();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const dayData = days.map((dateKey) => {
            const dayEntries = getEntriesByDate(dateKey);
            const total = dayEntries.reduce((sum, e) => sum + e.calories, 0);
            const d = new Date(dateKey + 'T00:00:00');
            return {
                dateKey,
                dayName: dayNames[d.getDay()],
                total,
                isToday: dateKey === today,
            };
        });

        const maxCal = Math.max(dailyGoal, ...dayData.map((d) => d.total), 1);

        dom.weeklyChart.innerHTML = dayData
            .map((d) => {
                const heightPercent = Math.min((d.total / maxCal) * 100, 100);
                const isOver = d.total > dailyGoal;
                return `
                <div class="day-column">
                    <div class="day-calories">${d.total > 0 ? d.total : '—'}</div>
                    <div class="day-bar-track">
                        <div class="day-bar ${isOver ? 'over' : ''} ${d.isToday ? 'today' : ''}"
                             style="height: ${heightPercent}%"></div>
                    </div>
                    <span class="day-label ${d.isToday ? 'today' : ''}">${d.dayName}</span>
                </div>
            `;
            })
            .join('');
    }

    // ───── Render History ─────
    function renderHistory() {
        const dates = getUniqueDates().slice(0, 14); // Last 14 unique days

        if (dates.length === 0) {
            dom.emptyHistory.style.display = 'flex';
            // Remove any history day elements
            const historyDays = dom.historyList.querySelectorAll('.history-day');
            historyDays.forEach((el) => el.remove());
            return;
        }

        dom.emptyHistory.style.display = 'none';

        const html = dates
            .map((dateKey) => {
                const dayEntries = getEntriesByDate(dateKey);
                const total = dayEntries.reduce((sum, e) => sum + e.calories, 0);
                const itemCount = dayEntries.length;
                const status = total > dailyGoal ? 'over' : total === dailyGoal ? 'at' : 'under';
                const statusText =
                    total > dailyGoal
                        ? `+${total - dailyGoal} over goal`
                        : total === dailyGoal
                        ? 'Goal reached!'
                        : `${dailyGoal - total} under goal`;

                return `
                <div class="history-day">
                    <div class="history-day-info">
                        <span class="history-day-date">${formatDate(dateKey)}</span>
                        <span class="history-day-detail">${itemCount} item${itemCount !== 1 ? 's' : ''} · ${statusText}</span>
                    </div>
                    <div class="history-day-calories">
                        <span class="history-day-total ${status}">${total.toLocaleString()}</span>
                        <span class="history-day-goal">/ ${dailyGoal.toLocaleString()} kcal</span>
                    </div>
                </div>
            `;
            })
            .join('');

        // Keep empty-state element, replace other content
        const existingHistoryDays = dom.historyList.querySelectorAll('.history-day');
        existingHistoryDays.forEach((el) => el.remove());

        dom.historyList.insertAdjacentHTML('beforeend', html);
    }

    // ───── Full Re-render ─────
    function renderAll() {
        renderStats();
        renderProgressRing();
        renderMealCategories();
        renderWeeklyChart();
        renderHistory();
    }

    // ───── Event: Add Meal ─────
    function handleAddMeal(e) {
        e.preventDefault();

        const name = dom.inputFoodName.value.trim();
        const calories = parseInt(dom.inputCalories.value, 10);
        const protein = parseInt(dom.inputProtein.value, 10) || 0;
        const carbs = parseInt(dom.inputCarbs.value, 10) || 0;
        const fat = parseInt(dom.inputFat.value, 10) || 0;

        if (!name || isNaN(calories) || calories <= 0) {
            showToast('⚠️ Please fill in food name and calories');
            return;
        }

        const entry = {
            id: generateId(),
            name,
            calories,
            protein,
            carbs,
            fat,
            category: selectedCategory,
            date: getTodayKey(),
            timestamp: Date.now(),
        };

        entries.push(entry);
        saveEntries();

        // Reset form
        dom.formAddMeal.reset();
        selectedCategory = 'breakfast';
        updateCategoryButtons();

        closeModal(dom.modalAddMeal);
        renderAll();

        showToast(`✅ Added "${name}" — ${calories} kcal`);

        // Auto-expand the category
        const catEl = document.querySelector(`[data-category="${entry.category}"]`);
        if (catEl && !catEl.classList.contains('expanded')) {
            catEl.classList.add('expanded');
        }
    }

    // ───── Event: Delete Entry ─────
    function handleDeleteEntry(id) {
        const entry = entries.find((e) => e.id === id);
        if (!entry) return;

        entries = entries.filter((e) => e.id !== id);
        saveEntries();
        renderAll();
        showToast(`🗑️ Removed "${entry.name}"`);
    }

    // ───── Event: Save Settings ─────
    function handleSaveSettings(e) {
        e.preventDefault();

        const newGoal = parseInt(dom.inputDailyGoal.value, 10);
        const newName = dom.inputUserName.value.trim();

        if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) {
            showToast('⚠️ Goal must be between 500 and 10,000 kcal');
            return;
        }

        dailyGoal = newGoal;
        saveGoal();
        saveUserName(newName);

        closeModal(dom.modalSettings);
        renderAll();
        showToast('⚙️ Settings saved!');
    }

    // ───── Event: Clear All History ─────
    function handleClearHistory() {
        if (entries.length === 0) {
            showToast('Nothing to clear!');
            return;
        }

        const confirmed = confirm('Are you sure you want to delete ALL entries? This cannot be undone.');
        if (!confirmed) return;

        entries = [];
        saveEntries();
        renderAll();
        showToast('🗑️ All entries cleared');
    }

    // ───── Modal Helpers ─────
    function openModal(modalEl) {
        modalEl.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first input
        setTimeout(() => {
            const firstInput = modalEl.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 200);
    }

    function closeModal(modalEl) {
        modalEl.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ───── Category Selection ─────
    function updateCategoryButtons() {
        const buttons = document.querySelectorAll('.cat-btn');
        buttons.forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-cat') === selectedCategory);
        });
    }

    // ───── Expand/Collapse Meal Categories ─────
    function toggleCategory(categoryEl) {
        categoryEl.classList.toggle('expanded');
    }

    // ───── Header Scroll Effect ─────
    function handleScroll() {
        if (window.scrollY > 10) {
            dom.appHeader.classList.add('scrolled');
        } else {
            dom.appHeader.classList.remove('scrolled');
        }
    }

    // ───── Set Date Display ─────
    function setDateDisplay() {
        dom.dateDisplay.textContent = formatFullDate(new Date());
    }

    // ───── Event Bindings ─────
    function bindEvents() {
        // Open modals
        dom.btnAddMeal.addEventListener('click', () => {
            openModal(dom.modalAddMeal);
        });

        dom.btnSettings.addEventListener('click', () => {
            dom.inputDailyGoal.value = dailyGoal;
            dom.inputUserName.value = getUserName();
            openModal(dom.modalSettings);
        });

        // Close modals
        dom.btnCloseAddModal.addEventListener('click', () => closeModal(dom.modalAddMeal));
        dom.btnCloseSettingsModal.addEventListener('click', () => closeModal(dom.modalSettings));

        // Close modal on overlay click
        [dom.modalAddMeal, dom.modalSettings].forEach((modal) => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });

        // Close modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal(dom.modalAddMeal);
                closeModal(dom.modalSettings);
            }
        });

        // Form submissions
        dom.formAddMeal.addEventListener('submit', handleAddMeal);
        dom.formSettings.addEventListener('submit', handleSaveSettings);

        // Category button selection
        document.querySelectorAll('.cat-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                selectedCategory = btn.getAttribute('data-cat');
                updateCategoryButtons();
            });
        });

        // Expand/collapse meal categories
        document.querySelectorAll('.category-header').forEach((header) => {
            header.addEventListener('click', () => {
                const categoryEl = header.closest('.meal-category');
                toggleCategory(categoryEl);
            });
        });

        // Delete meal entry (event delegation)
        document.querySelector('.meal-categories').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-item');
            if (deleteBtn) {
                e.stopPropagation();
                const id = deleteBtn.getAttribute('data-id');
                handleDeleteEntry(id);
            }
        });

        // Clear history
        dom.btnClearHistory.addEventListener('click', handleClearHistory);

        // Scroll
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // ───── Init ─────
    function init() {
        loadData();
        setDateDisplay();
        bindEvents();
        renderAll();

        // Refresh at midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight - now;

        setTimeout(() => {
            setDateDisplay();
            renderAll();
            // Then refresh every 24 hours
            setInterval(() => {
                setDateDisplay();
                renderAll();
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
