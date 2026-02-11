// script.js
const TELEGRAM_CONFIG = {
    BOT_TOKEN: '837izItw63rCxjwp0FN4dLQH-4gp94',
    CHAT_ID: '-109076754'
};

// Календарь
class WeddingCalendar {
    constructor() {
        this.currentDate = new Date(2026, 7, 1); // Август 2026
        this.weddingDate = new Date(2026, 7, 1);
        this.init();
    }

    init() {
        this.renderCalendar();
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const monthYear = document.getElementById('currentMonthYear');
        const calendarDays = document.getElementById('calendarDays');
        
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];

        monthYear.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        calendarDays.innerHTML = '';

        // Получаем первый и последний день месяца
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Получаем день недели для первого дня (0-воскресенье, 6-суббота)
        let firstDayOfWeek = firstDay.getDay();
        // Преобразуем к формату Пн=0, Вс=6
        if (firstDayOfWeek === 0) firstDayOfWeek = 6;
        else firstDayOfWeek--;

        // Добавляем пустые ячейки для дней предыдущего месяца
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarDays.appendChild(emptyDay);
        }

        // Добавляем дни текущего месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Проверяем, является ли день днем свадьбы
            if (this.currentDate.getMonth() === this.weddingDate.getMonth() &&
                this.currentDate.getFullYear() === this.weddingDate.getFullYear() &&
                day === this.weddingDate.getDate()) {
                dayElement.classList.add('wedding-day');
            }

            calendarDays.appendChild(dayElement);
        }

        // Добавляем пустые ячейки в конце, если нужно
        const totalCells = firstDayOfWeek + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day other-month';
                calendarDays.appendChild(emptyDay);
            }
        }
    }
}

// Инициализация календаря
const weddingCalendar = new WeddingCalendar();

// Анимации при скролле
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => observer.observe(group));
    
    // Плавная прокрутка для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Отправка формы в Telegram
class TelegramSender {
    constructor() {
        this.token = TELEGRAM_CONFIG.BOT_TOKEN;
    }

    getChatId() {
        return TELEGRAM_CONFIG.CHAT_ID;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    async sendFormData(formData) {
        const chatId = this.getChatId();
        const message = this.formatMessage(formData);
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            return result.ok;
        } catch (error) {
            console.error('Ошибка:', error);
            return false;
        }
    }

    formatMessage(data) {
        const attendanceText = {
            'yes': '✅ С радостью приду!',
            'no': '❌ К сожалению, не смогу',
            'maybe': '❓ Пока не уверен(а)'
        }[data.attendance] || data.attendance;

        const alcoholText = data.alcohol ? data.alcohol.join(', ') : 'Не важно';

        return `
<b>🎉 НОВЫЙ ОТВЕТ НА СВАДЕБНОЕ ПРИГЛАШЕНИЕ</b>

<b>👤 Имя:</b> ${data.name}
<b>📞 Телефон:</b> ${data.phone}
<b>👥 Гостей:</b> ${data.guests}

<b>✅ Присутствие:</b> ${attendanceText}
<b>🍷 Напитки:</b> ${alcoholText}

<b>⚠️ Аллергии/особенности:</b> ${data.allergies || 'нет'}
<b>💌 Пожелания:</b> ${data.message || 'нет'}

<b>📅 Отправлено:</b> ${new Date().toLocaleString('ru-RU')}
        `.trim();
    }
}

const telegramSender = new TelegramSender();

document.getElementById('weddingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-button');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    telegramSender.showNotification('Отправляем ваш ответ...', 'loading');
    
    try {
        const alcoholCheckboxes = document.querySelectorAll('input[name="alcohol"]:checked');
        const alcoholValues = Array.from(alcoholCheckboxes).map(cb => cb.value);
        
        const attendanceRadio = document.querySelector('input[name="attendance"]:checked');
        
        if (!attendanceRadio) {
            throw new Error('Пожалуйста, выберите вариант присутствия');
        }
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            guests: document.getElementById('guests').value,
            attendance: attendanceRadio.value,
            alcohol: alcoholValues,
            allergies: document.getElementById('allergies').value.trim(),
            message: document.getElementById('message').value.trim()
        };
        
        // Валидация
        if (!formData.name || !formData.phone) {
            throw new Error('Пожалуйста, заполните обязательные поля');
        }
        
        const success = await telegramSender.sendFormData(formData);
        
        if (success) {
            telegramSender.showNotification('✅ Спасибо! Ваш ответ отправлен организаторам.', 'success');
            e.target.reset();
        } else {
            telegramSender.showNotification('❌ Ошибка отправки. Пожалуйста, попробуйте еще раз.', 'error');
        }
    } catch (error) {
        telegramSender.showNotification(`❌ ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Предзагрузка только необходимых изображений
window.addEventListener('load', function() {
    const images = ['7.webp', '3.webp']; // Только главное фото и фото для локации
    images.forEach(img => {
        const image = new Image();
        image.src = img;
    });
});