/* ===========================
   CaloriQ — Smart Calorie Tracker
   Modernist Build with Unified Hero & Macro Tracking
   Vanilla JS with localStorage
   =========================== */

(function () {
    'use strict';

    // ───── Auth System ─────
    const AUTH_KEYS = {
        USERS: 'caloriq_users',
        SESSION: 'caloriq_session',
    };

    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEYS.USERS)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
    }

    function getSession() {
        return localStorage.getItem(AUTH_KEYS.SESSION);
    }

    function setSession(email) {
        localStorage.setItem(AUTH_KEYS.SESSION, email);
    }

    function clearSession() {
        localStorage.removeItem(AUTH_KEYS.SESSION);
    }

    function getLogged_inUser() {
        const email = getSession();
        if (!email) return null;
        const users = getUsers();
        return users.find(u => u.email === email) || null;
    }

    function showAuthError(msg) {
        const el = document.getElementById('auth-error');
        if (el) {
            el.textContent = msg;
            el.classList.remove('hidden');
        }
    }

    function hideAuthError() {
        const el = document.getElementById('auth-error');
        if (el) el.classList.add('hidden');
    }

    function initAuth(onSuccess) {
        const authScreen = document.getElementById('auth-screen');
        const appContainer = document.getElementById('app-container');
        const formLogin = document.getElementById('form-login');
        const formSignup = document.getElementById('form-signup');
        const btnShowSignup = document.getElementById('btn-show-signup');
        const btnShowLogin = document.getElementById('btn-show-login');
        const loginWrapper = document.getElementById('login-form-wrapper');
        const signupWrapper = document.getElementById('signup-form-wrapper');
        const btnLogout = document.getElementById('btn-logout');

        // Check existing session
        if (getLogged_inUser()) {
            authScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            return true;
        }

        // Show auth screen
        authScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');

        // Toggle forms
        if (btnShowSignup) {
            btnShowSignup.addEventListener('click', () => {
                hideAuthError();
                loginWrapper.classList.add('hidden');
                signupWrapper.classList.remove('hidden');
            });
        }

        if (btnShowLogin) {
            btnShowLogin.addEventListener('click', () => {
                hideAuthError();
                signupWrapper.classList.add('hidden');
                loginWrapper.classList.remove('hidden');
            });
        }

        // Login
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                hideAuthError();
                const email = document.getElementById('login-email').value.trim().toLowerCase();
                const password = document.getElementById('login-password').value;

                if (!email || !password) {
                    showAuthError('Please fill in all fields.');
                    return;
                }

                const users = getUsers();
                const user = users.find(u => u.email === email);

                if (!user || user.passwordHash !== hashPassword(password)) {
                    showAuthError('Invalid email or password.');
                    return;
                }

                setSession(email);
                authScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                if (onSuccess) onSuccess();
            });
        }

        // Signup
        if (formSignup) {
            formSignup.addEventListener('submit', (e) => {
                e.preventDefault();
                hideAuthError();
                const name = document.getElementById('signup-name').value.trim();
                const email = document.getElementById('signup-email').value.trim().toLowerCase();
                const password = document.getElementById('signup-password').value;
                const confirm = document.getElementById('signup-password-confirm').value;

                if (!name || !email || !password || !confirm) {
                    showAuthError('Please fill in all fields.');
                    return;
                }

                if (password.length < 6) {
                    showAuthError('Password must be at least 6 characters.');
                    return;
                }

                if (password !== confirm) {
                    showAuthError('Passwords do not match.');
                    return;
                }

                const users = getUsers();
                if (users.find(u => u.email === email)) {
                    showAuthError('An account with this email already exists.');
                    return;
                }

                users.push({ name, email, passwordHash: hashPassword(password) });
                saveUsers(users);
                setSession(email);

                try { localStorage.setItem('caloriq_user_name', name); } catch (e) {}

                authScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                if (onSuccess) onSuccess();
            });
        }

        // Logout
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                clearSession();
                authScreen.classList.remove('hidden');
                appContainer.classList.add('hidden');
                if (formLogin) formLogin.reset();
                if (formSignup) formSignup.reset();
                hideAuthError();
                if (loginWrapper) loginWrapper.classList.remove('hidden');
                if (signupWrapper) signupWrapper.classList.add('hidden');
            });
        }

        return false;
    }

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
        // Progress Ring
        progressRingFill: $('progress-ring-fill'),
        progressPercentage: $('progress-percentage'),
        // Macros
        proteinDisplay: $('macro-protein-display'),
        carbsDisplay: $('macro-carbs-display'),
        fatDisplay: $('macro-fat-display'),
        proteinBar: $('macro-protein-bar'),
        carbsBar: $('macro-carbs-bar'),
        fatBar: $('macro-fat-bar'),
        // Meal items
        breakfastItems: $('breakfast-items'),
        lunchItems: $('lunch-items'),
        dinnerItems: $('dinner-items'),
        snacksItems: $('snacks-items'),
        breakfastCalories: $('breakfast-calories'),
        lunchCalories: $('lunch-calories'),
        dinnerCalories: $('dinner-calories'),
        snacksCalories: $('snacks-calories'),
        breakfastMacros: $('breakfast-macros'),
        lunchMacros: $('lunch-macros'),
        dinnerMacros: $('dinner-macros'),
        snacksMacros: $('snacks-macros'),
        // Charts & History
        weeklyChart: $('weekly-chart'),
        historyList: $('history-list'),
        emptyHistory: $('empty-history'),
        // Buttons
        btnAddMeal: $('btn-add-meal'),
        btnHeaderAdd: $('btn-header-add'),
        fabQuickAdd: $('fab-quick-add'),
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
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    function animateValue(element, start, end, duration) {
        if (!element) return;
        const startTime = performance.now();
        const diff = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + diff * eased);
            element.textContent = current.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    function showToast(message) {
        if (!dom.toast || !dom.toastMessage) return;
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

    function getMacrosToday() {
        const todayItems = getTodayEntries();
        return todayItems.reduce(
            (acc, item) => ({
                protein: acc.protein + (Number(item.protein) || 0),
                carbs: acc.carbs + (Number(item.carbs) || 0),
                fat: acc.fat + (Number(item.fat) || 0),
            }),
            { protein: 0, carbs: 0, fat: 0 }
        );
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

    // ───── Render Stats & Ring ─────
    function renderStats() {
        const consumed = getTotalCaloriesToday();
        const remaining = Math.max(0, dailyGoal - consumed);

        const prevConsumed = parseInt(dom.totalConsumed.textContent.replace(/,/g, ''), 10) || 0;
        const prevRemaining = parseInt(dom.totalRemaining.textContent.replace(/,/g, ''), 10) || 0;

        animateValue(dom.totalConsumed, prevConsumed, consumed, 500);
        animateValue(dom.totalRemaining, prevRemaining, remaining, 500);
        if (dom.dailyGoalDisplay) dom.dailyGoalDisplay.textContent = dailyGoal.toLocaleString();
    }

    function renderProgressRing() {
        if (!dom.progressRingFill || !dom.progressPercentage) return;
        const consumed = getTotalCaloriesToday();
        const percentage = dailyGoal > 0 ? (consumed / dailyGoal) * 100 : 0;
        const clamped = Math.min(percentage, 100);

        const circumference = 2 * Math.PI * 85;
        const offset = circumference - (clamped / 100) * circumference;

        dom.progressRingFill.style.strokeDasharray = circumference;
        dom.progressRingFill.style.strokeDashoffset = offset;

        if (percentage > 100) {
            dom.progressRingFill.classList.add('over');
            dom.progressPercentage.textContent = Math.round(percentage) + '%';
        } else {
            dom.progressRingFill.classList.remove('over');
            dom.progressPercentage.textContent = Math.round(percentage) + '%';
        }
    }

    // ───── Render Macros ─────
    function renderMacros() {
        const macros = getMacrosToday();

        // Estimated daily targets derived from calorie goal
        const targetProtein = Math.max(50, Math.round((dailyGoal * 0.25) / 4));
        const targetCarbs = Math.max(100, Math.round((dailyGoal * 0.50) / 4));
        const targetFat = Math.max(30, Math.round((dailyGoal * 0.25) / 9));

        if (dom.proteinDisplay) dom.proteinDisplay.textContent = `${macros.protein}g / ${targetProtein}g`;
        if (dom.carbsDisplay) dom.carbsDisplay.textContent = `${macros.carbs}g / ${targetCarbs}g`;
        if (dom.fatDisplay) dom.fatDisplay.textContent = `${macros.fat}g / ${targetFat}g`;

        const pPct = Math.min(100, Math.round((macros.protein / targetProtein) * 100));
        const cPct = Math.min(100, Math.round((macros.carbs / targetCarbs) * 100));
        const fPct = Math.min(100, Math.round((macros.fat / targetFat) * 100));

        if (dom.proteinBar) dom.proteinBar.style.width = pPct + '%';
        if (dom.carbsBar) dom.carbsBar.style.width = cPct + '%';
        if (dom.fatBar) dom.fatBar.style.width = fPct + '%';
    }

    // ───── Render Meal Categories ─────
    function renderMealCategories() {
        const categories = ['breakfast', 'lunch', 'dinner', 'snacks'];
        const today = getTodayKey();

        categories.forEach((cat) => {
            const itemsContainer = dom[cat + 'Items'];
            const caloriesDisplay = dom[cat + 'Calories'];
            const macrosDisplay = dom[cat + 'Macros'];

            const catEntries = entries.filter((e) => e.date === today && e.category === cat);
            const totalCal = catEntries.reduce((sum, e) => sum + e.calories, 0);
            const totalProtein = catEntries.reduce((sum, e) => sum + (Number(e.protein) || 0), 0);

            if (caloriesDisplay) caloriesDisplay.textContent = totalCal + ' kcal';
            if (macrosDisplay) macrosDisplay.textContent = totalProtein > 0 ? `${totalProtein}g protein` : `${catEntries.length} items`;

            if (!itemsContainer) return;

            if (catEntries.length === 0) {
                itemsContainer.innerHTML = '<div class="empty-category">No items logged yet</div>';
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
        return parts.length > 0 ? parts.join(' · ') : 'No macros entered';
    }

    // ───── Render Weekly Chart ─────
    function renderWeeklyChart() {
        if (!dom.weeklyChart) return;
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
        if (!dom.historyList) return;
        const dates = getUniqueDates().slice(0, 14);

        if (dates.length === 0) {
            if (dom.emptyHistory) dom.emptyHistory.style.display = 'flex';
            const historyDays = dom.historyList.querySelectorAll('.history-day');
            historyDays.forEach((el) => el.remove());
            return;
        }

        if (dom.emptyHistory) dom.emptyHistory.style.display = 'none';

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

        const existingHistoryDays = dom.historyList.querySelectorAll('.history-day');
        existingHistoryDays.forEach((el) => el.remove());
        dom.historyList.insertAdjacentHTML('beforeend', html);
    }

    // ───── Full Re-render ─────
    function renderAll() {
        renderStats();
        renderProgressRing();
        renderMacros();
        renderMealCategories();
        renderWeeklyChart();
        renderHistory();
    }

    // ───── Smart Auto-Expand by Time of Day ─────
    function autoExpandCurrentCategory() {
        const hour = new Date().getHours();
        let target = 'breakfast';
        if (hour >= 11 && hour < 16) target = 'lunch';
        else if (hour >= 16 && hour < 21) target = 'dinner';
        else if (hour >= 21 || hour < 5) target = 'snacks';

        const catEl = document.querySelector(`[data-category="${target}"]`);
        if (catEl && !catEl.classList.contains('expanded')) {
            catEl.classList.add('expanded');
        }
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
            showToast('⚠️ Please enter food name and calories');
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

        dom.formAddMeal.reset();
        closeModal(dom.modalAddMeal);
        renderAll();

        showToast(`✅ Added "${name}" (${calories} kcal)`);

        // Expand the target category
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
        showToast('⚙️ Settings updated!');
    }

    // ───── Event: Clear All History ─────
    function handleClearHistory() {
        if (entries.length === 0) {
            showToast('Nothing to clear!');
            return;
        }

        const confirmed = confirm('Are you sure you want to clear ALL entries? This action cannot be undone.');
        if (!confirmed) return;

        entries = [];
        saveEntries();
        renderAll();
        showToast('🗑️ All entries cleared');
    }

    // ───── Modal Helpers ─────
    function openMealModalWithCategory(cat) {
        if (cat) {
            selectedCategory = cat;
            updateCategoryButtons();
        }
        openModal(dom.modalAddMeal);
    }

    function openModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const firstInput = modalEl.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 150);
    }

    function closeModal(modalEl) {
        if (!modalEl) return;
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
        if (!dom.appHeader) return;
        if (window.scrollY > 10) {
            dom.appHeader.classList.add('scrolled');
        } else {
            dom.appHeader.classList.remove('scrolled');
        }
    }

    // ───── Set Date Display ─────
    function setDateDisplay() {
        if (dom.dateDisplay) {
            dom.dateDisplay.textContent = formatFullDate(new Date());
        }
    }

    // ───── Tab Navigation ─────
    function initTabs() {
        const tabs = document.querySelectorAll('.segment-tab');
        const views = document.querySelectorAll('.tab-view');

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const targetViewId = tab.getAttribute('data-tab');

                tabs.forEach((t) => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                views.forEach((v) => v.classList.remove('active'));

                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                const targetView = document.getElementById(targetViewId);
                if (targetView) targetView.classList.add('active');
            });
        });
    }

    // ───── Event Bindings ─────
    function bindEvents() {
        // Quick add buttons
        if (dom.btnAddMeal) dom.btnAddMeal.addEventListener('click', () => openMealModalWithCategory());
        if (dom.btnHeaderAdd) dom.btnHeaderAdd.addEventListener('click', () => openMealModalWithCategory());
        if (dom.fabQuickAdd) dom.fabQuickAdd.addEventListener('click', () => openMealModalWithCategory());

        // Category direct quick-add buttons (+)
        document.querySelectorAll('.btn-cat-quick-add').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cat = btn.getAttribute('data-quick-cat');
                openMealModalWithCategory(cat);
            });
        });

        // Settings modal
        if (dom.btnSettings) {
            dom.btnSettings.addEventListener('click', () => {
                if (dom.inputDailyGoal) dom.inputDailyGoal.value = dailyGoal;
                if (dom.inputUserName) dom.inputUserName.value = getUserName();
                openModal(dom.modalSettings);
            });
        }

        // Close modals
        if (dom.btnCloseAddModal) dom.btnCloseAddModal.addEventListener('click', () => closeModal(dom.modalAddMeal));
        if (dom.btnCloseSettingsModal) dom.btnCloseSettingsModal.addEventListener('click', () => closeModal(dom.modalSettings));

        [dom.modalAddMeal, dom.modalSettings].forEach((modal) => {
            if (!modal) return;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal(dom.modalAddMeal);
                closeModal(dom.modalSettings);
            }
        });

        // Form submissions
        if (dom.formAddMeal) dom.formAddMeal.addEventListener('submit', handleAddMeal);
        if (dom.formSettings) dom.formSettings.addEventListener('submit', handleSaveSettings);

        // Category modal chips
        document.querySelectorAll('.cat-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                selectedCategory = btn.getAttribute('data-cat');
                updateCategoryButtons();
            });
        });

        // Expand/collapse category cards
        document.querySelectorAll('.category-header').forEach((header) => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.btn-cat-quick-add')) return;
                const categoryEl = header.closest('.meal-category');
                toggleCategory(categoryEl);
            });
        });

        // Delete meal item delegation
        const mealContainer = document.getElementById('meal-categories');
        if (mealContainer) {
            mealContainer.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.btn-delete-item');
                if (deleteBtn) {
                    e.stopPropagation();
                    const id = deleteBtn.getAttribute('data-id');
                    handleDeleteEntry(id);
                }
            });
        }

        // Clear history
        if (dom.btnClearHistory) dom.btnClearHistory.addEventListener('click', handleClearHistory);

        // Scroll
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Initialize tabs
        initTabs();
    }

    // ───── Init ─────
    let appStarted = false;

    function startApp() {
        if (appStarted) return;
        appStarted = true;
        loadData();
        setDateDisplay();
        bindEvents();
        renderAll();
        autoExpandCurrentCategory();

        // Refresh at midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight - now;

        setTimeout(() => {
            setDateDisplay();
            renderAll();
            setInterval(() => {
                setDateDisplay();
                renderAll();
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    // Start
    const boot = () => {
        const ok = initAuth(startApp);
        if (ok) startApp();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
