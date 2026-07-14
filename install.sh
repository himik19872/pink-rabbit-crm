#!/bin/bash
# ===================================================================
# RabbitCRM — скрипт автоустановки на чистую Ubuntu 22.04 / Debian 12
# ===================================================================
# Запуск:
#   chmod +x install.sh
#   sudo ./install.sh
#
# После установки:
#   Веб-интерфейс: http://IP-адрес:3000
#   API:           http://IP-адрес:8000/api/
#   Swagger:       http://IP-адрес:8000/api/docs/
#   Админка:       http://IP-адрес:8000/admin/
#   Логин: admin / admin123
# ===================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║       🐰 RabbitCRM — Установка              ║"
echo "║   CRM для коммерческого кролиководства      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Проверка root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Пожалуйста, запустите от root: sudo ./install.sh${NC}"
    exit 1
fi

# Конфигурация
INSTALL_DIR="/opt/rabbit-crm"
APP_USER="${SUDO_USER:-rabbitcrm}"
DB_NAME="rabbitcrm"
DB_USER="rabbitcrm"
DB_PASS="rabbitcrm_secret_$(date +%s | sha256sum | base64 | head -c 8)"
ADMIN_PASS="admin123"
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "📦 Шаг 1/7: Установка системных зависимостей..."
apt-get update -qq
apt-get install -y -qq \
    python3 python3-pip python3-venv python3-dev \
    postgresql postgresql-client \
    nginx curl git \
    build-essential libpq-dev \
    nodejs npm \
    certbot python3-certbot-nginx 2>/dev/null || true

# Node.js 20 если старая версия
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 18 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

echo -e "${GREEN}✓ Системные зависимости установлены${NC}"

echo ""
echo "📂 Шаг 2/7: Клонирование репозитория..."
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Директория $INSTALL_DIR уже существует — обновляем...${NC}"
    cd "$INSTALL_DIR"
    git pull 2>/dev/null || true
else
    git clone https://github.com/himik1987/rabbit-crm.git "$INSTALL_DIR" 2>/dev/null || {
        echo -e "${YELLOW}GitHub недоступен — предполагаем что файлы уже в $INSTALL_DIR${NC}"
        mkdir -p "$INSTALL_DIR"
    }
fi
cd "$INSTALL_DIR"

echo -e "${GREEN}✓ Репозиторий готов${NC}"

echo ""
echo "🗄️ Шаг 3/7: Настройка PostgreSQL..."
# Создаём БД и пользователя
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo -e "${YELLOW}База $DB_NAME уже существует${NC}"
else
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || true
    echo -e "${GREEN}✓ База данных создана${NC}"
fi

echo ""
echo "🐍 Шаг 4/7: Настройка Python-окружения..."
cd "$INSTALL_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
pip install gunicorn -q

# Создаём .env
cat > .env << EOF
DJANGO_SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
DJANGO_DEBUG=False
DATABASE_NAME=$DB_NAME
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASS
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=$SERVER_IP,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000
EOF

# Миграции и статика
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Создаём админа
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@rabbitcrm.local', '$ADMIN_PASS')
    print('Admin created')
"

# Загружаем фикстуры если есть
if [ -f "fixtures/initial_data.json" ]; then
    python manage.py loaddata fixtures/initial_data.json 2>/dev/null || true
fi

deactivate
echo -e "${GREEN}✓ Бэкенд настроен${NC}"

echo ""
echo "⚛️ Шаг 5/7: Сборка фронтенда..."
cd "$INSTALL_DIR/frontend"
npm install --legacy-peer-deps 2>/dev/null
npm run build 2>/dev/null
echo -e "${GREEN}✓ Фронтенд собран${NC}"

echo ""
echo "🔧 Шаг 6/7: Настройка systemd и nginx..."

# systemd для бэкенда
cat > /etc/systemd/system/rabbitcrm-backend.service << SYSTEMD
[Unit]
Description=RabbitCRM Backend (Gunicorn)
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/.venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$INSTALL_DIR/backend/.venv/bin/gunicorn rabbitcrm.wsgi:application --bind 127.0.0.1:8000 --workers 3
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD

# systemd для фронтенда
cat > /etc/systemd/system/rabbitcrm-frontend.service << SYSTEMD
[Unit]
Description=RabbitCRM Frontend (serve)
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=$(which npx) serve -s build -l 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD

# nginx конфиг
cat > /etc/nginx/sites-available/rabbitcrm << NGINX
server {
    listen 80;
    server_name $SERVER_IP;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /media/ {
        alias $INSTALL_DIR/backend/media/;
    }

    location /static/ {
        alias $INSTALL_DIR/backend/staticfiles/;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/rabbitcrm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Создаём пользователя
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false "$APP_USER" 2>/dev/null || true
fi
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"

echo -e "${GREEN}✓ Конфиги созданы${NC}"

echo ""
echo "🚀 Шаг 7/7: Запуск сервисов..."
systemctl daemon-reload
systemctl enable rabbitcrm-backend rabbitcrm-frontend
systemctl restart rabbitcrm-backend rabbitcrm-frontend
systemctl restart nginx

sleep 3

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     🎉 RabbitCRM успешно установлен!         ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║  🌐 Веб-интерфейс: http://$SERVER_IP          ║"
echo "║  📚 Swagger API:   http://$SERVER_IP/api/docs/ ║"
echo "║  🔧 Админка:       http://$SERVER_IP/admin/    ║"
echo "║                                              ║"
echo "║  👤 Логин:    admin                          ║"
echo "║  🔑 Пароль:   $ADMIN_PASS                     ║"
echo "║                                              ║"
echo "║  📱 Мобильное приложение:                    ║"
echo "║     Установите Expo Go из Google Play        ║"
echo "║     Отсканируйте QR в терминале сервера      ║"
echo "║     или введите адрес сервера вручную        ║"
echo "║                                              ║"
echo "║  📋 Статус:  systemctl status rabbitcrm-*    ║"
echo "║  📝 Логи:    journalctl -u rabbitcrm-* -f    ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

exit 0
