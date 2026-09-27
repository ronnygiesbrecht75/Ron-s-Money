# Ron's Money - Gestión de Dinero 💰

Aplicación completa para la administración y control de finanzas personales y negocios: ingresos, egresos, bancos en Guaraníes (PYG) y Dólares (USD), categorías personalizadas, balance general, seguridad con PIN / biometría y respaldos en la nube con Google Drive.

---

## 🚀 Cómo Generar y Descargar los Instaladores (.exe y .apk) en GitHub

Este repositorio ya está 100% configurado para que **GitHub compile automáticamente los instaladores de Windows (.exe) y Android (.apk)**.

### Paso 1: Subir el proyecto a tu repositorio de GitHub
Si aún no has subido tu proyecto a GitHub:
```bash
git init
git add .
git commit -m "feat: preparar instaladores Windows y Android con GitHub Actions"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

---

### Paso 2: Generar los Instaladores Automáticamente

Tienes **dos opciones** muy sencillas:

#### Opción A: Con 1 solo clic desde la web de GitHub (Manual sin comandos)
1. Entra a tu repositorio en GitHub en tu navegador.
2. Haz clic en la pestaña **"Actions"** arriba.
3. En la barra lateral izquierda, selecciona el flujo **"Build and Release Installers (Windows & Android)"**.
4. Haz clic en el botón azul a la derecha **"Run workflow"** y luego en **"Run workflow"**.
5. ¡Listo! Los servidores de GitHub compilarán el `.exe` y el `.apk` en paralelo.

#### Opción B: Mediante una etiqueta de versión (Git Tag)
Cada vez que crees una etiqueta de versión desde tu terminal:
```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub detectará la etiqueta y compilará la versión automáticamente.

---

### Paso 3: Descargar los Instaladores

1. En tu repositorio de GitHub, ve a la sección **"Releases"** (en la columna derecha de la página principal).
2. Verás la versión publicada con dos archivos listos para descargar:
   - 💻 **`Rons-Money-Setup-1.0.0.exe`**: Instalador para Windows. Solo descárgalo, ábrelo y dale a "Siguiente" para instalarlo en tu PC con acceso directo en el escritorio.
   - 📱 **`Rons-Money-v1.0.0.apk`**: Instalador para Android. Descárgalo en tu celular y pulsa "Instalar".

---

## 💻 Desarrollo Local

Para correr la aplicación en tu computadora localmente:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo web
npm run dev

# 3. Compilar aplicación web
npm run build
```
