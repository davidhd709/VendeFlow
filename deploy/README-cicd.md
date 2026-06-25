# VentasFlow — CI/CD: de tu máquina al VPS

Flujo completo: **push a `main`** → GitHub Actions corre tests (CI) → construye imágenes Docker → las sube a GitHub Container Registry → despliega en el VPS por SSH.

---

## Arquitectura

```
Local (tu máquina)
  └─ git push origin main
       │
       ▼
GitHub Actions — CI (.github/workflows/ci.yml)
  └─ pnpm install → tests backend → tsc check frontend
       │ (si pasa)
       ▼
GitHub Actions — Deploy (.github/workflows/deploy.yml)
  ├─ Build & push: ghcr.io/{owner}/ventasflow-backend:{sha7}
  ├─ Build & push: ghcr.io/{owner}/ventasflow-frontend:{sha7}
  └─ SSH al VPS → docker compose pull/up → prisma migrate deploy
       │
       ▼
VPS (Ubuntu)  /home/ingenierohenry/ventasflow
  ├─ postgres  (puerto interno)
  ├─ backend   (puerto interno → proxy nginx)
  └─ frontend  (nginx, :80 / :443)
```

---

## Paso 1 — Generar par de claves SSH para el CI/CD

Ejecutar **en tu máquina local** (no en el VPS):

```bash
ssh-keygen -t ed25519 -C "ventasflow-github-actions" -f ~/.ssh/ventasflow_deploy -N ""
```

Esto genera:
- `~/.ssh/ventasflow_deploy` → **clave privada** (va a GitHub Secret `VPS_SSH_KEY`)
- `~/.ssh/ventasflow_deploy.pub` → **clave pública** (va al VPS `authorized_keys`)

---

## Paso 2 — Agregar clave pública al VPS

```bash
# Desde tu máquina, copia la clave al VPS:
ssh-copy-id -i ~/.ssh/ventasflow_deploy.pub usuario@IP_DEL_VPS

# O manualmente en el VPS:
cat ~/.ssh/ventasflow_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Verifica que funciona:
```bash
ssh -i ~/.ssh/ventasflow_deploy usuario@IP_DEL_VPS echo "OK"
```

---

## Paso 3 — Configurar GitHub Secrets

En tu repositorio: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP pública del VPS (ej. `123.45.67.89`) |
| `VPS_USER` | Usuario SSH del VPS (ej. `ubuntu`, `root`) |
| `VPS_SSH_KEY` | Contenido de `~/.ssh/ventasflow_deploy` (clave **privada**) |
| `DEPLOY_PATH` | `/home/ingenierohenry/ventasflow` |
| `GHCR_TOKEN` | Personal Access Token con scope `read:packages` (ver abajo) |

### Generar GHCR_TOKEN

1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token** → seleccionar scope: `read:packages`
3. Copiar el token generado → pegarlo como `GHCR_TOKEN`

> El `GITHUB_TOKEN` automático del workflow solo sirve para **push** de imágenes en el CI.
> El VPS necesita un token propio para hacer **pull** (`read:packages`).

---

## Paso 4 — Setup inicial del VPS

Conectarse al VPS y ejecutar:

```bash
# Clonar el repo (solo para obtener los scripts de deploy)
git clone https://github.com/TU_USUARIO/ventasflow.git /tmp/ventasflow-setup
cd /tmp/ventasflow-setup

# Ejecutar setup (instala Docker, crea directorios, configura firewall)
sudo bash deploy/setup-vps.sh
```

Luego editar los secretos reales:
```bash
nano /home/ingenierohenry/ventasflow/.env.prod
```

Ver [deploy/env.prod.example](env.prod.example) como referencia. Los campos obligatorios son:
- `POSTGRES_PASSWORD` — contraseña segura (mínimo 32 caracteres)
- `DATABASE_URL` — debe coincidir con `POSTGRES_USER/PASSWORD/DB`
- `JWT_SECRET` y `JWT_REFRESH_SECRET` — strings aleatorios de 64 bytes
- `FRONTEND_URL` — URL pública sin barra final

Generar secrets aleatorios:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Paso 5 — Primer deploy

Hacer push a `main`:
```bash
git push origin main
```

Monitorear en **GitHub → Actions**:
1. Primero corre el workflow **CI**
2. Si pasa, corre **Deploy** → construye imágenes → despliega en el VPS

El primer deploy tarda ~5-8 minutos (descarga base images, compila Angular, etc.).
Los siguientes usan caché de GHA y tardan ~2-3 minutos.

---

## Paso 6 — Configurar HTTPS (opcional pero recomendado)

Después de que el primer deploy HTTP funcione y el dominio DNS apunte al VPS:

```bash
# En el VPS
bash /home/ingenierohenry/ventasflow/deploy/enable-ssl.sh tudominio.com tu@email.com
```

El script:
1. Obtiene el certificado Let's Encrypt
2. Activa el bloque HTTPS en nginx
3. Configura renovación automática vía cron

---

## Estructura de archivos en el VPS

```
/home/ingenierohenry/ventasflow/
├── docker-compose.prod.yml    # compose de producción
├── .env.prod                  # secretos (NUNCA en git)
├── .env.deploy                # tags de imágenes (actualizado por CI/CD)
└── deploy/
    ├── nginx.ssl.conf         # template nginx HTTPS
    ├── nginx.ssl.conf.current # nginx HTTPS con dominio relleno (generado por enable-ssl.sh)
    ├── enable-ssl.sh          # script para activar HTTPS
    └── env.prod.example       # referencia de variables
```

---

## Flujo de deploy resumido

```
push main
  ↓
CI: pnpm test backend + tsc frontend
  ↓ (success)
Deploy job:
  1. docker buildx build → ghcr.io/{owner}/ventasflow-backend:{sha7}
  2. docker buildx build → ghcr.io/{owner}/ventasflow-frontend:{sha7}
  3. SSH → VPS:
       - docker login ghcr.io
       - sed .env.deploy (actualiza tags)
       - docker compose pull
       - docker compose up -d
       - prisma migrate deploy
       - docker image prune -f
```

---

## Comandos útiles en el VPS

```bash
# Ver estado de contenedores
docker compose -f /home/ingenierohenry/ventasflow/docker-compose.prod.yml \
  --env-file /home/ingenierohenry/ventasflow/.env.prod \
  --env-file /home/ingenierohenry/ventasflow/.env.deploy \
  ps

# Ver logs del backend
docker logs ventasflow-backend -f --tail 100

# Ver logs del frontend (nginx)
docker logs ventasflow-frontend -f --tail 50

# Entrar al contenedor del backend
docker exec -it ventasflow-backend sh

# Forzar re-deploy manual (sin push)
cd /home/ingenierohenry/ventasflow
docker compose -f docker-compose.prod.yml \
  --env-file .env.prod \
  --env-file .env.deploy \
  up -d --pull always
```
