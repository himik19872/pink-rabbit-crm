<p align="center">
  <img src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f430.svg" width="80" alt="Кролик">
</p>

<h1 align="center">🐰 RabbitCRM</h1>
<p align="center"><strong>CRM-система для коммерческого кролиководства</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-4.2-092e20?logo=django" alt="Django">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Expo-54-000?logo=expo" alt="Expo">
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker" alt="Docker">
</p>

---

## 📋 Содержание
- [Возможности](#-возможности)
- [Быстрая установка](#-быстрая-установка)
- [Архитектура](#-архитектура)
- [API](#-api)
- [Мобильное приложение](#-мобильное-приложение)
- [Генеалогическая система ID](#-генеалогическая-система-id)
- [Обслуживание](#-обслуживание)

---

## 🚀 Возможности

### 🐇 Учёт кроликов
- **Генеалогические ID** — по ID сразу видно кто чей ребёнок: `M001-F002-00001`
- Полный профиль: ID, кличка, пол, статус, порода
- Родословная до 4 поколений (рекурсивная)
- **Генеалогические линии** (отцовские / материнские)
- История взвешиваний
- Фильтрация: статус, пол, порода, мать, отец, возраст (от/до)
- Статусы: Молодняк → Мясной / Племенной / Декоративный

### 🏠 Размещение
- Иерархия: **Корпус → Ряд → Ярус → Клетка**
- **QR-коды** и **штрих-коды** (Code128) на каждую клетку
- Пакетная печать этикеток (выбор клеток → лист A4 с наклейками)
- Заселение / освобождение с историей перемещений
- Редактирование вместимости клеток (племенные по 1, мясные по несколько)

### 🧬 Разведение
- Племенные пары (самец × самка) — CRUD
- **Случки** → авто-беременность (ожидаемый окот +31 день)
- **Таймер беременности** на дашборде — сколько дней осталось
- Окоты: помёт, живые/мёртвые, **авто-создание крольчат** с обоими родителями
- **Авто-перевод молодняка** в мясные через 30 дней

### 🔪 Учёт забоя
- Запись: живой вес → чистый вес тушки → **убойный выход %**
- Статистика: общий живой вес, выход мяса, средние показатели
- При забое кролик переводится в статус SOLD

### 🍽️ Кормление, 🏥 Ветеринария, 📊 Аналитика
- Склад кормов, раздача по кроликам, закупки
- Вет. мероприятия, медкарты, карантин
- Статистика поголовья, разведения, производства

### 👥 Управление пользователями
- CRUD пользователей, смена паролей (только для админов)
- JWT-токен 8 часов + refresh 7 дней

### 📱 Мобильное приложение (Expo Go)
- **QR/штрих-код сканер** — навёл камеру → увидел кролика
- Быстрые действия: взвесить, покормить, осмотреть, вода
- Тестовый режим (ручной ввод ID клетки)

---

## ⚡ Быстрая установка

### Автоустановка (Ubuntu/Debian)
```bash
wget -O install.sh https://raw.githubusercontent.com/himik1987/rabbit-crm/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

Скрипт сам установит PostgreSQL, Python, Node.js, nginx, соберёт фронтенд и запустит всё как systemd-сервисы.

После установки:
| Ресурс | URL |
|--------|-----|
| 🌐 Веб-интерфейс | `http://IP-сервера` |
| 📚 Swagger API | `http://IP-сервера/api/docs/` |
| 🔧 Админка | `http://IP-сервера/admin/` |
| 👤 Логин | `admin` / `admin123` |

### Ручная установка (разработка)
```bash
git clone https://github.com/himik1987/rabbit-crm.git
cd rabbit-crm

# Бэкенд
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp rabbitcrm/settings/local.example.py rabbitcrm/settings/local.py  # при необходимости
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Фронтенд (новый терминал)
cd frontend
npm install --legacy-peer-deps
npm start                         # http://localhost:3000
```

### Docker
```bash
docker compose up -d
# Бэкенд: 8000 | Фронтенд: 3000 | БД: 5432
```

---

## 🏗 Архитектура

```
rabbit-crm/
├── backend/                 # 🐍 Django 4.2 + DRF
│   ├── rabbitcrm/
│   │   ├── core/            # Базовые утилиты, UserViewSet
│   │   ├── apps/
│   │   │   ├── rabbits/     # 🐇 Кролики, веса, забой
│   │   │   ├── housing/     # 🏠 Клетки, QR, вода
│   │   │   ├── health/      # 🏥 Ветеринария
│   │   │   ├── feeding/     # 🍽️ Кормление
│   │   │   ├── breeding/    # 🧬 Разведение, случки, окоты
│   │   │   └── analytics/   # 📊 Аналитика
│   │   ├── settings/        # base/local/production
│   │   └── utils/           # QR-генератор
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # ⚛️ React 18 + Ant Design 5
│   └── src/
│       ├── pages/           # 10 страниц
│       ├── components/      # Layout, LabelPrinter
│       └── services/        # API-клиенты
├── mobile/                  # 📱 React Native + Expo 54
│   └── src/
│       ├── screens/         # QRScanner, HomeScreen
│       └── services/
├── systemd/                 # systemd-юниты
├── install.sh               # 🚀 Автоустановка
├── docker-compose.yml
└── README.md
```

---

## 🔌 API

### Аутентификация (JWT)
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/jwt/create/` | Логин — получить access + refresh токены |
| POST | `/api/auth/jwt/refresh/` | Обновить access-токен |
| GET | `/api/auth/users/me/` | Данные текущего пользователя |

### Основные эндпоинты
| Ресурс | URL | Действия |
|--------|-----|----------|
| Кролики | `/api/rabbits/rabbits/` | CRUD + фильтры: `?status=BREEDING&age_min=6&mother=1` |
| Веса | `/api/rabbits/weights/` | CRUD |
| Забой | `/api/rabbits/slaughters/` | CRUD + `stats/` |
| Помещения | `/api/housing/buildings/` | CRUD |
| Клетки | `/api/housing/cages/` | CRUD + `assign/` `clear/` `scan/` `labels/` |
| Случки | `/api/breeding/matings/` | CRUD → авто-беременность |
| Беременности | `/api/breeding/pregnancies/` | CRUD (таймер окота) |
| Окоты | `/api/breeding/kindlings/` | CRUD + `promote_young/` |
| Ген. линии | `/api/breeding/lines/` | CRUD |
| Пользователи | `/api/users/` | CRUD + `change_password/` (только админ) |

📖 **Swagger:** `http://localhost:8000/api/docs/`

---

## 📱 Мобильное приложение

### Установка на телефон
1. Установите **Expo Go** из Google Play / App Store
2. На сервере запустите: `cd mobile && npx expo start --lan`
3. Отсканируйте QR-код из терминала камерой телефона
4. Войдите с логином/паролем

### Как пользоваться
| Шаг | Действие |
|-----|----------|
| 1 | Нажмите «📷 Сканировать QR-код» |
| 2 | Наведите камеру на QR-код или штрих-код на клетке |
| 3 | Увидите карточку кролика: имя, ID, порода, возраст |
| 4 | Быстрые действия: ⚖️ Взвесить / 🍽️ Покормить / 🩺 Осмотр / 💧 Вода |

### Формат кодов
- **QR-код:** `RABBITCRM:CAGE:21`
- **Штрих-код (Code128):** `CAGE000021`
- **Ручной ввод:** откройте «🧪 Тест: ввести ID клетки» → введите номер

---

## 🧬 Генеалогическая система ID

Каждый кролик получает «говорящий» ID, по которому видна родословная:

| Тип | Формат | Пример |
|-----|--------|--------|
| Основатель | `M001` / `F001` | `M006` — самец №6 |
| Дети | `Отец-Мать-Номер` | `M006-F004-00001` — первенец ♂M006 × ♀F004 |
| Кросс линий | `M006-F004-00003-M001-F002-00001-00001` — скрещивание двух линий |

По ID сразу видно кто родители и какой по счёту ребёнок в помёте.

---

## 🔧 Обслуживание

### Управление сервисами
```bash
systemctl status rabbitcrm-backend rabbitcrm-frontend
systemctl restart rabbitcrm-backend
journalctl -u rabbitcrm-backend -f   # логи
```

### Перевод молодняка
Молодняк (статус YOUNG) старше 30 дней можно перевести:
- На странице «Разведение» → вкладка «Окоты» → кнопка «🔄 Перевести молодняк»
- Или API: `POST /api/breeding/kindlings/promote_young/?status=MEAT`

### Резервное копирование
```bash
pg_dump rabbitcrm > backup_$(date +%Y%m%d).sql
```

---

## 📄 Лицензия

MIT License — свободное использование и модификация.

---

<p align="center">
  <strong>🐰 Сделано с любовью к кролиководству!</strong>
</p>
