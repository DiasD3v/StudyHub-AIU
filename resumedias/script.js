// 1. ТЕМА (СВЕТЛАЯ / ТЁМНАЯ)
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// 2. МУЛЬТИЯЗЫЧНОСТЬ
const translations = {
    ru: {
        header_subtitle: "Frontend-разработчик",
        nav_home: "Главная",
        nav_about: "Обо мне",
        nav_skills: "Навыки",
        nav_projects: "Проекты",
        nav_edu: "Образование",
        nav_contact: "Контакты",
        hero_specialty: "Frontend-разработчик / IT Student",
        hero_university: "Astana International University (AIU)",
        hero_desc: "Студент AIU, начинающий Frontend-разработчик. Увлекаюсь созданием удобных пользовательских интерфейсов, изучением современных веб-технологий и программированием.",
        btn_contact: "Связаться со мной",
        btn_projects: "Посмотреть проекты",
        about_title: "Обо мне",
        about_bio_title: "О себе",
        about_bio_text: "Обучаюсь в Astana International University (AIU). Активно развиваюсь в сфере IT, интересуюсь веб-разработкой и алгоритмами.",
        about_goals_title: "Цели в IT",
        about_goals_text: "Освоить современные JavaScript-фреймворки (React/Vue), прокачать навыки коммерческой верстки и вырасти до уровня Middle Frontend-разработчика.",
        about_interests_title: "Интересы",
        about_interests_text: "Веб-дизайн, оптимизация интерфейсов, участие в учебных IT-проектах, спортивное программирование и современные технологии.",
        about_traits_title: "Личные качества",
        about_traits_text: "Целеустремленность, внимательность к деталям, способность быстро обучаться, ответственность и аналитический склад ума.",
        skills_title: "Мои навыки",
        skill_html_desc: "Базовая верстка, адаптивный дизайн, стилизация компонентов",
        skill_js_desc: "Базовый уровень, манипуляция DOM, обработка событий",
        skill_cpp_desc: "Основы алгоритмов, ООП, структурирование кода",
        skill_git_desc: "Контроль версий, фиксация изменений, работа с репозиториями",
        projects_title: "Проекты",
        project_1_desc: "Платформа и студенческий хаб для учащихся AIU, созданный для удобного обмена учебными материалами и ресурсами.",
        project_2_desc: "Адаптивный одностраничный сайт-портфолио с поддержкой светлой/тёмной темы и мультиязычности.",
        btn_more: "Открыть на GitHub",
        edu_title: "Образование и опыт",
        edu_uni: "Astana International University (AIU)",
        edu_degree: "Студент IT-направления",
        edu_achievements: "Изучение базовых дисциплин по программированию, алгоритмам, структурам данных и веб-технологиям.",
        exp_title: "Практический опыт и проекты",
        exp_company: "Учебная практика / Самообучение",
        exp_desc: "На данный момент активно развиваю практические навыки через создание учебных проектов и работу с open-source репозиториями на GitHub.",
        lang_title: "Владение языками",
        lang_kk: "Казахский",
        lang_kk_lvl: "Родной язык",
        lang_ru: "Русский",
        lang_ru_lvl: "Свободный",
        lang_en: "Английский",
        lang_en_lvl: "Элементарный (A2)",
        contact_title: "Контакты",
        contact_city: "Город",
        contact_city_val: "Астана, Казахстан",
        form_name: "Ваше имя",
        form_email: "Ваш Email",
        form_msg: "Сообщение",
        form_btn: "Отправить сообщение",
        footer_rights: "Все права защищены."
    },
    kk: {
        header_subtitle: "Frontend-әзірлеуші",
        nav_home: "Басты бет",
        nav_about: "Мен туралы",
        nav_skills: "Дағдылар",
        nav_projects: "Жобалар",
        nav_edu: "Білім",
        nav_contact: "Байланыс",
        hero_specialty: "Frontend-әзірлеуші / IT Студент",
        hero_university: "Astana International University (AIU)",
        hero_desc: "AIU студенті, бастапқы деңгейдегі Frontend-әзірлеуші. Ыңғайлы веб-интерфейстерді жасауға және бағдарламалауға әуеспін.",
        btn_contact: "Менімен байланысу",
        btn_projects: "Жобаларды қарау",
        about_title: "Мен туралы",
        about_bio_title: "Өзім туралы",
        about_bio_text: "Astana International University (AIU) оқу орнында білім алудамын. IT саласында белсенді дамып келемін.",
        about_goals_title: "IT-дегі мақсаттар",
        about_goals_text: "Заманауи JavaScript фреймворктарын меңгеру және Middle Frontend-әзірлеуші деңгейіне өсу.",
        about_interests_title: "Қызығушылықтар",
        about_interests_text: "Веб-дизайн, интерфейстерді оңтайландыру, оқу IT-жобаларына қатысу.",
        about_traits_title: "Жеке қасиеттер",
        about_traits_text: "Мақсаттылық, ұқыптылық, тез үйрену қабілеті және жауапкершілік.",
        skills_title: "Меңгерген дағдылар",
        skill_html_desc: "Базалық верстка, адаптивті дизайн, компоненттер стилі",
        skill_js_desc: "Базалық деңгей, DOM манипуляциясы, оқиғаларды өңдеу",
        skill_cpp_desc: "Алгоритмдер негіздері, ТАБ, кодты құрылымдау",
        skill_git_desc: "Нұсқаларды бақылау, GitHub репозиторийлерімен жұмыс",
        projects_title: "Жобалар",
        project_1_desc: "AIU студенттеріне арналған оқу материалдары мен ресурстарымен бөлісетін платформа.",
        project_2_desc: "Адаптивті, екі түсті тақырыбы және тіл таңдауы бар жеке сайт-резюме.",
        btn_more: "GitHub-та ашу",
        edu_title: "Білім мен тәжірибе",
        edu_uni: "Astana International University (AIU)",
        edu_degree: "IT-бағытының студенті",
        edu_achievements: "Бағдарламалау, алгоритмдер және веб-технологиялар бойынша базалық пәндерді оқу.",
        exp_title: "Тәжірибелік дағдылар",
        exp_company: "Оқу тәжірибесі / Өздігінен үйрену",
        exp_desc: "Қазіргі уақытта оқу жобалары мен GitHub арқылы тәжірибелік дағдыларымды дамытудамын.",
        lang_title: "Тілдерді меңгеру",
        lang_kk: "Қазақ тілі",
        lang_kk_lvl: "Ана тілі",
        lang_ru: "Орыс тілі",
        lang_ru_lvl: "Еркін",
        lang_en: "Ағылшын тілі",
        lang_en_lvl: "Бастапқы (A2)",
        contact_title: "Байланыс",
        contact_city: "Қала",
        contact_city_val: "Астана, Қазақстан",
        form_name: "Сіздің атыңыз",
        form_email: "Сіздің Email",
        form_msg: "Хабарлама",
        form_btn: "Хабарлама жіберу",
        footer_rights: "Барлық құқықтар қорғалған."
    },
    en: {
        header_subtitle: "Frontend Developer",
        nav_home: "Home",
        nav_about: "About",
        nav_skills: "Skills",
        nav_projects: "Projects",
        nav_edu: "Education",
        nav_contact: "Contact",
        hero_specialty: "Frontend Developer / IT Student",
        hero_university: "Astana International University (AIU)",
        hero_desc: "AIU student, junior Frontend developer. Passionate about building modern user interfaces, web development, and coding.",
        btn_contact: "Contact Me",
        btn_projects: "View Projects",
        about_title: "About Me",
        about_bio_title: "Biography",
        about_bio_text: "Studying at Astana International University (AIU). Passionate about IT and modern web technologies.",
        about_goals_title: "IT Goals",
        about_goals_text: "Master JS frameworks (React/Vue) and grow into a strong Middle Frontend Developer.",
        about_interests_title: "Interests",
        about_interests_text: "Web design, UI optimization, student projects, competitive programming.",
        about_traits_title: "Traits",
        about_traits_text: "Goal-oriented, detail-oriented, fast learner, responsible.",
        skills_title: "My Skills",
        skill_html_desc: "Basic layout, responsive design, component styling",
        skill_js_desc: "Basic JS, DOM manipulation, event handling",
        skill_cpp_desc: "Algorithms basics, OOP, clean structure",
        skill_git_desc: "Version control, commits, repository management",
        projects_title: "Projects",
        project_1_desc: "A platform and study hub for AIU students to share study materials easily.",
        project_2_desc: "Responsive portfolio page supporting dark mode and multi-language features.",
        btn_more: "Open on GitHub",
        edu_title: "Education & Experience",
        edu_uni: "Astana International University (AIU)",
        edu_degree: "IT Student",
        edu_achievements: "Studying computer science fundamentals, algorithms, and web basics.",
        exp_title: "Experience & Practice",
        exp_company: "Academic Projects / Self-study",
        exp_desc: "Constantly improving frontend skills through study projects and GitHub open-source repositories.",
        lang_title: "Languages",
        lang_kk: "Kazakh",
        lang_kk_lvl: "Native",
        lang_ru: "Russian",
        lang_ru_lvl: "Fluent",
        lang_en: "English",
        lang_en_lvl: "Elementary (A2)",
        contact_title: "Contact",
        contact_city: "City",
        contact_city_val: "Astana, Kazakhstan",
        form_name: "Your Name",
        form_email: "Your Email",
        form_msg: "Message",
        form_btn: "Send Message",
        footer_rights: "All rights reserved."
    }
};

const langSelect = document.getElementById('lang-select');
langSelect.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
});

function changeLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

// 3. МОБИЛЬНОЕ МЕНЮ
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// 4. АНИМАЦИЯ ПРИ ПРОКРУТКЕ
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});

// 5. ДЕМО-ОТПРАВКА ФОРМЫ
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formStatus.style.color = '#10b981';
    
    const lang = langSelect.value;
    if (lang === 'kk') {
        formStatus.textContent = 'Рахмет! Хабарламаңыз жіберілді.';
    } else if (lang === 'en') {
        formStatus.textContent = 'Thank you! Message sent successfully.';
    } else {
        formStatus.textContent = 'Спасибо! Сообщение успешно отправлено.';
    }

    contactForm.reset();
    setTimeout(() => { formStatus.textContent = ''; }, 4000);
});