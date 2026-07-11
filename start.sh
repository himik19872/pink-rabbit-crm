#!/bin/bash
# RabbitCRM — скрипт запуска всех сервисов
# Разместить: /home/himik/rabbit-crm/start.sh

set -e

PROJECT_DIR="/home/himik/rabbit-crm"
LOG_DIR="/var/log"
VENV="$PROJECT_DIR/backend/.venv"

echo "=== RabbitCRM Startup $(date) ===" | tee -a $LOG_DIR/rabbitcrm.log

# 1. Бэкенд (Django + SQLite/PostgreSQL)
echo "[backend] Запуск Django..."
cd $PROJECT_DIR/backend
source $VENV/bin/activate
python manage.py migrate --noinput 2>&1 | tee -a $LOG_DIR/rabbitcrm-backend.log
python manage.py runserver 0.0.0.0:8000 >> $LOG_DIR/rabbitcrm-backend.log 2>&1 &
BACKEND_PID=$!
echo "[backend] PID: $BACKEND_PID" | tee -a $LOG_DIR/rabbitcrm.log

# 2. Фронтенд (React dev-server через serve)
echo "[frontend] Запуск React..."
cd $PROJECT_DIR/frontend
if [ -d "build" ]; then
    npx serve -s build -l 3000 >> $LOG_DIR/rabbitcrm-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "[frontend] PID: $FRONTEND_PID (production build)" | tee -a $LOG_DIR/rabbitcrm.log
else
    PORT=3000 npm start >> $LOG_DIR/rabbitcrm-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "[frontend] PID: $FRONTEND_PID (dev server)" | tee -a $LOG_DIR/rabbitcrm.log
fi

# 3. Мобильное (статический web-экспорт)
echo "[mobile] Запуск Expo Web..."
cd $PROJECT_DIR/mobile
if [ -d "dist" ]; then
    python3 -m http.server 8082 --directory dist >> $LOG_DIR/rabbitcrm-mobile.log 2>&1 &
    MOBILE_PID=$!
    echo "[mobile] PID: $MOBILE_PID" | tee -a $LOG_DIR/rabbitcrm.log
else
    echo "[mobile] dist/ не найден — пропускаем" | tee -a $LOG_DIR/rabbitcrm.log
fi

echo "=== Все сервисы запущены ===" | tee -a $LOG_DIR/rabbitcrm.log
echo "  Бэкенд:    http://localhost:8000"
echo "  Фронтенд:  http://localhost:3000"
echo "  Мобильное: http://localhost:8082"
echo "  Swagger:   http://localhost:8000/api/docs/"

# Ждём завершения (чтобы systemd не считал сервис упавшим)
wait
