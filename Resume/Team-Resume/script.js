document.addEventListener("DOMContentLoaded", () => {
    
    // =====================================
    // 1. SPA НАВИГАЦИЯ (Переключение страниц)
    // =====================================
    function switchPage(targetId) {
        document.querySelectorAll('.page-view').forEach(page => page.style.display = 'none');
        document.querySelectorAll('.browser-tab').forEach(tab => tab.classList.remove('active'));
        
        document.getElementById(targetId).style.display = 'block';
        const activeTab = document.querySelector(`.browser-tab[data-target="${targetId}"]`);
        if (activeTab) activeTab.classList.add('active');
        window.scrollTo(0, 0);
    }

    document.querySelectorAll('.browser-tab, .spa-link').forEach(el => {
        el.addEventListener('click', function() {
            switchPage(this.getAttribute('data-target'));
        });
    });

    // =====================================
    // 2. ГЛОБАЛЬНАЯ ТЕМА
    // =====================================
    const themeBtn = document.querySelector('.tab-theme-btn');
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme); // Для Диаса и Главной
        localStorage.setItem('theme', theme);
    }

    let currentTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(currentTheme);

    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    });

    // =====================================
    // 3. ГЛОБАЛЬНАЯ ЛОКАЛИЗАЦИЯ
    // =====================================
    const langSelect = document.querySelector('.tab-lang-select');
    
    const dictionary = {
        ru: {
            hero_label: "OUR PORTFOLIO", hero_title: "Наши резюме", choose_resume: "Выберите резюме",
            role_t: "IT Student & Project Team Lead", role_d: "Frontend-разработчик / IT Student",
            open_btn: "Открыть резюме →", navAbout: "Обо мне", navSkills: "Навыки", navProjects: "Проекты",
            navExperience: "Опыт", navContact: "Контакты", hello: "Привет, меня зовут",
            profession: "IT Student & Project Team Lead", nav_home: "Главная", nav_about: "Обо мне",
            nav_skills: "Навыки", nav_projects: "Проекты", nav_edu: "Образование", nav_contact: "Контакты",
            header_subtitle: "Frontend-разработчик"
        },
        kz: {
            hero_label: "БІЗДІҢ ПОРТФОЛИО", hero_title: "Біздің түйіндемелер", choose_resume: "Түйіндемені таңдаңыз",
            role_t: "IT студенті және жоба жетекшісі", role_d: "Frontend-әзірлеуші / IT Студент",
            open_btn: "Түйіндемені ашу →", navAbout: "Мен туралы", navSkills: "Дағдылар", navProjects: "Жобалар",
            navExperience: "Тәжірибе", navContact: "Байланыс", hello: "Сәлем, менің атым",
            profession: "IT студенті және жоба жетекшісі", nav_home: "Басты бет", nav_about: "Мен туралы",
            nav_skills: "Дағдылар", nav_projects: "Жобалар", nav_edu: "Білім", nav_contact: "Байланыс",
            header_subtitle: "Frontend-әзірлеуші"
        },
        en: {
            hero_label: "OUR PORTFOLIO", hero_title: "Our Resumes", choose_resume: "Choose a resume",
            role_t: "IT Student & Project Team Lead", role_d: "Frontend Developer / IT Student",
            open_btn: "Open resume →", navAbout: "About me", navSkills: "Skills", navProjects: "Projects",
            navExperience: "Experience", navContact: "Contact", hello: "Hello, my name is",
            profession: "IT Student & Project Team Lead", nav_home: "Home", nav_about: "About",
            nav_skills: "Skills", nav_projects: "Projects", nav_edu: "Education", nav_contact: "Contact",
            header_subtitle: "Frontend Developer"
        }
    };

    function applyLanguage(lang) {
        const dict = dictionary[lang] || dictionary['ru'];
        document.querySelectorAll('[data-lang], [data-i18n]').forEach(el => {
            const key = el.getAttribute('data-lang') || el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        localStorage.setItem('language', lang);
    }

    let currentLang = localStorage.getItem('language') || 'ru';
    if (currentLang === 'kk') currentLang = 'kz';
    langSelect.value = currentLang;
    applyLanguage(currentLang);

    langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));

    // =====================================
    // 4. МЕНЮ ДИАСА (Мобильное)
    // =====================================
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
        document.querySelectorAll('#page-dias .nav-link').forEach(link => {
            link.addEventListener('click', () => navMenu.classList.remove('active'));
        });
    }
});