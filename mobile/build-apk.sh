#!/bin/bash
# Сборка APK для RabbitCRM Mobile
# Требования: JDK 17+, Android SDK 34+, ANDROID_HOME установлен

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="$PROJECT_DIR/mobile"

if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME не установлен!"
    echo "   export ANDROID_HOME=/opt/android-sdk  (или ваш путь)"
    exit 1
fi

echo "🐰 Сборка RabbitCRM APK..."
echo "   ANDROID_HOME=$ANDROID_HOME"

cd "$MOBILE_DIR"

# 1. Генерируем нативный Android-проект (если ещё нет)
if [ ! -d "android" ]; then
    echo "📱 Генерация Android-проекта..."
    npx expo prebuild --platform android --no-install
fi

# 2. Экспортируем JS-бандл
echo "📦 Экспорт JS-бандла..."
npx expo export --platform android --output-dir dist-android 2>/dev/null || true

# 3. Собираем APK через Gradle
echo "🔨 Gradle сборка..."
cd android
./gradlew assembleRelease

# 4. Результат
APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    SIZE=$(du -h "$APK_PATH" | cut -f1)
    cp "$APK_PATH" "$MOBILE_DIR/RabbitCRM.apk"
    echo ""
    echo "✅ APK собран: $MOBILE_DIR/RabbitCRM.apk ($SIZE)"
else
    echo "❌ APK не найден. Проверь логи Gradle."
    exit 1
fi
