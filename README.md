<p align="center">
  <img src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f430.svg" width="80" alt="Кролик">
</p>

<h1 align="center">🐰 RabbitCRM</h1>
<p align="center"><strong>CRM-система для коммерческого кролиководства</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-4.2-092e20?logo=django" alt="Django">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Expo-51-000?logo=expo" alt="Expo">
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker" alt="Docker">
</p>

---

## 📋 Содержание
- [Возможности](#-возможности)
- [Архитектура](#-архитектура)
- [Установка](#-установка)
- [API](#-api)
- [Мобильное приложение](#-мобильное-приложение)
- [Скриншоты](#-скриншоты)

---

## 🚀 Возможности

### 🐇 Учёт кроликов
- Полный профиль: ID, кличка, пол, статус, порода, фото
- **Родословная** до 4 поколений (мать/отец, рекурсивная pedigree)
- **Генеалогические линии** (отцовские линии / материнские семейства)
- История взвешиваний с графиком
- Фильтрация по статусу, полу, породе, родителям

### 🏠 Управление размещением
- Иерархия: **Корпус → Ряд → Ярус → Клетка**
- Каждая клетка имеет уникальный адрес
- **QR-коды** на каждую клетку (автоматическая генерация)
- Заселение/освобождение клеток с историей перемещений
- Учёт уборки и дезинфекции
- **Расход воды** по клеткам

### 🧬 Разведение
- Племенные пары (самец × самка)
- Учёт случек (естественное / искусственное осеменение)
- Отслеживание беременностей (~31 день)
- Окоты: размер помёта, живые/мёртвые/мумии
- **Выживаемость** в процентах

### 🍽️ Кормление
- Типы кормов (сено, зерно, комбикорм, свежие, добавки)
- Складской учёт с ценами и сроками годности
- Раздача корма по кроликам (утро/день/вечер)
- Дневной план кормления

### 🏥 Ветеринария
- Мероприятия: прививки, лечение, карантин, осмотр, хирургия, дегельминтизация
- Медицинские карты (аллергии, хроника)
- Уровень риска и срочность
- Карантин с отслеживанием

### 📱 Мобильное приложение
- **QR-сканер** — навёл камеру на клетку → увидел кролика
- Быстрые действия: взвесить, покормить, осмотреть, записать воду, уборку
- Работает офлайн-совместимо через Expo

### 📊 Аналитика
- Дашборд с ключевыми показателями
- Статистика разведения (топ-матерей, выживаемость)
- Расход кормов и воды
- Ветеринарная статистика

---

## 🏗 Архитектура

```
pink-rabbit-crm/
├── backend/                 # 🐍 Django 4.2 + DRF 3.15
│   ├── rabbitcrm/
│   │   ├── core/            # Базовые утилиты, BaseModel
│   │   ├── apps/
│   │   │   ├── rabbits/     # 🐇 Кролики: модель, CRUD, веса, фото
│   │   │   ├── housing/     # 🏠 Размещение: иерархия клеток, QR, вода
│   │   │   ├── health/      # 🏥 Здоровье: мероприятия, медкарты
│   │   │   ├── feeding/     # 🍽️ Кормление: типы, склад, раздача
│   │   │   ├── breeding/    # 🧬 Разведение: пары, окоты, линии
│   │   │   └── analytics/   # 📊 Аналитика: отчёты, статистика
│   │   ├── settings/        # Конфигурация (base/local/production)
│   │   └── utils/           # QR-генератор, миксины, права
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                # 🖥️ React 18 + TypeScript + Ant Design 5
│   ├── src/
│   │   ├── components/      # Layout, RabbitList
│   │   ├── pages/           # 8 страниц (Dashboard → Analytics)
│   │   ├── services/        # API-клиенты (7 сервисов)
│   │   └── contexts/        # AuthContext (JWT)
│   └── package.json
│
├── mobile/                  # 📱 React Native + Expo 51
│   ├── src/
│   │   ├── screens/         # Login, Home, QRScanner
│   │   ├── services/        # API-клиенты
│   │   └── contexts/        # AuthContext (AsyncStorage)
│   ├── app.json
│   └── package.json
│
├── docker-compose.yml       # 🐳 Docker: db + backend + frontend
└── README.md
```

---

## ⚡ Установка

### Предварительные требования
- Python 3.12+, Node.js 18+, npm 9+
- PostgreSQL 15 (или SQLite для разработки)
- Docker и Docker Compose (опционально)

### Быстрый старт (локально)

```bash
# 1. Клонируем репозиторий
git clone https://github.com/himik19872/pink-rabbit-crm.git
cd pink-rabbit-crm

# 2. Бэкенд
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # admin / admin123 / admin@rabbit.ru
python manage.py runserver

# 3. Фронтенд (новый терминал)
cd frontend
npm install --legacy-peer-deps
npm start                     # http://localhost:3000

# 4. Мобильное приложение (новый терминал)
cd mobile
npm install --legacy-peer-deps
npx expo start --web          # http://localhost:8081
```

### Docker (одной командой)

```bash
docker compose up -d
# Бэкенд:  http://localhost:8000
# Фронтенд: http://localhost:3000
# БД:       localhost:5432
```

---

## 🔌 API

### Аутентификация (JWT)
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/jwt/create/` | Получить токен |
| POST | `/api/auth/jwt/refresh/` | Обновить токен |
| GET | `/api/auth/users/me/` | Текущий пользователь |

### Основные эндпоинты
| Ресурс | URL | CRUD |
|--------|-----|------|
| Кролики | `/api/rabbits/rabbits/` | ✅ |
| Веса | `/api/rabbits/weights/` | ✅ |
| Помещения | `/api/housing/buildings/` | ✅ |
| Клетки | `/api/housing/cages/` | ✅ |
| QR-скан | `/api/housing/cages/scan/?cage_id=N` | GET |
| Расход воды | `/api/housing/water/` | ✅ |
| Вет-мероприятия | `/api/health/events/` | ✅ |
| Типы кормов | `/api/feeding/types/` | ✅ |
| Раздачи корма | `/api/feeding/distributions/` | ✅ |
| Плем. пары | `/api/breeding/pairs/` | ✅ |
| Окоты | `/api/breeding/kindlings/` | ✅ |
| Ген. линии | `/api/breeding/lines/` | ✅ |

📖 **Swagger-документация:** `http://localhost:8000/api/docs/`

---

## 📱 Мобильное приложение

### Поток работы
1. Войти (JWT-токен сохраняется в AsyncStorage)
2. Нажать «Сканировать QR-код клетки»
3. Навести камеру на QR-код на клетке
4. Увидеть профиль кролика и быстрые действия

### Быстрые действия
| Действие | API-запрос |
|----------|-----------|
| ⚖️ Взвешивание | `POST /rabbits/weights/` |
| 🍽️ Кормление | `POST /feeding/distributions/` |
| 🏥 Осмотр | `POST /health/events/` |
| 💧 Расход воды | `POST /housing/water/` |
| 🧹 Уборка | `PATCH /housing/cages/{id}/` |

### Формат QR-кода
```
RABBITCRM:CAGE:123:Корпус №1 - Ряд 1 - Ярус 1 - Клетка 5
```

### Сборка APK
```bash
cd mobile
npx expo build:android    # EAS Build (требуется аккаунт Expo)
# или локально:
npx expo prebuild
cd android && ./gradlew assembleRelease
```

---

## 🔧 systemd автозапуск

```bash
# Бэкенд
sudo cp systemd/rabbitcrm-backend.service /etc/systemd/system/
sudo systemctl enable rabbitcrm-backend --now

# Фронтенд
sudo cp systemd/rabbitcrm-frontend.service /etc/systemd/system/
sudo systemctl enable rabbitcrm-frontend --now
```

Подробнее: см. директорию [`systemd/`](systemd/).

---

## 🧑‍💻 Технологии

| Слой | Технологии |
|------|-----------|
| **Backend** | Django 4.2, DRF 3.15, PostgreSQL 15, SimpleJWT, drf-spectacular |
| **Frontend** | React 18, TypeScript 5, Ant Design 5, Axios, React Router 6 |
| **Mobile** | React Native 0.74, Expo 51, Expo Camera, React Navigation 6 |
| **DevOps** | Docker, Docker Compose, systemd |

---

## 📄 Лицензия

MIT License — свободное использование и модификация.

---

<p align="center">
  <strong>🐰 Сделано с любовью к кролиководству!</strong>
</p>
