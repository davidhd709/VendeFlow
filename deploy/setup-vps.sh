#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VentasFlow — Setup inicial del VPS (Ubuntu 22.04 / 24.04)
# Ejecutar UNA SOLA VEZ como root o usuario con sudo:
#   bash deploy/setup-vps.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/home/ingenierohenry/ventasflow}"
DEPLOY_USER="${DEPLOY_USER:-$(whoami)}"

echo "═══════════════════════════════════════════════════"
echo " VentasFlow — Setup VPS"
echo " DEPLOY_PATH : $DEPLOY_PATH"
echo " DEPLOY_USER : $DEPLOY_USER"
echo "═══════════════════════════════════════════════════"

# ── 1. Actualizar sistema ──────────────────────────────────────────────────
echo "→ Actualizando paquetes..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instalar Docker ─────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "→ Instalando Docker..."
  apt-get install -y -qq ca-certificates curl gnupg

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

  # Iniciar y habilitar
  systemctl enable --now docker

  echo "→ Agregando $DEPLOY_USER al grupo docker..."
  usermod -aG docker "$DEPLOY_USER" || true
else
  echo "✓ Docker ya instalado: $(docker --version)"
fi

# ── 3. Instalar Certbot ────────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "→ Instalando Certbot..."
  apt-get install -y -qq certbot
else
  echo "✓ Certbot ya instalado: $(certbot --version)"
fi

# ── 4. Crear directorio de deploy ─────────────────────────────────────────
echo "→ Creando directorio $DEPLOY_PATH..."
mkdir -p "$DEPLOY_PATH"
chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"

# ── 5. Copiar archivos de deploy ───────────────────────────────────────────
echo "→ Copiando docker-compose.prod.yml y nginx configs..."
cp "$(dirname "$0")/../docker-compose.prod.yml"  "$DEPLOY_PATH/"
cp -r "$(dirname "$0")"                           "$DEPLOY_PATH/"

# ── 6. Crear archivos .env vacíos ─────────────────────────────────────────
if [ ! -f "$DEPLOY_PATH/.env.prod" ]; then
  echo "→ Creando .env.prod de ejemplo (EDITAR antes de deployar)..."
  cp "$(dirname "$0")/env.prod.example" "$DEPLOY_PATH/.env.prod"
  echo ""
  echo "⚠️  IMPORTANTE: edita $DEPLOY_PATH/.env.prod con los valores reales"
fi

if [ ! -f "$DEPLOY_PATH/.env.deploy" ]; then
  echo "→ Creando .env.deploy vacío..."
  cat > "$DEPLOY_PATH/.env.deploy" << 'EOF'
# Actualizado automáticamente por GitHub Actions
BACKEND_IMAGE=ghcr.io/OWNER/ventasflow-backend:latest
FRONTEND_IMAGE=ghcr.io/OWNER/ventasflow-frontend:latest
EOF
fi

# ── 7. Configurar firewall ─────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  echo "→ Configurando UFW..."
  ufw allow 22/tcp   comment "SSH"
  ufw allow 80/tcp   comment "HTTP"
  ufw allow 443/tcp  comment "HTTPS"
  ufw --force enable
fi

# ── 8. Agregar clave SSH pública del CI/CD ─────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo " ✅ Setup completado"
echo "═══════════════════════════════════════════════════"
echo ""
echo " PRÓXIMOS PASOS:"
echo ""
echo " 1. Editar los secretos de la app:"
echo "      nano $DEPLOY_PATH/.env.prod"
echo ""
echo " 2. Agregar la clave SSH pública del CI/CD a authorized_keys:"
echo "      nano ~/.ssh/authorized_keys"
echo "    (ver instrucciones en deploy/README-cicd.md)"
echo ""
echo " 3. Configurar GitHub Secrets en el repositorio:"
echo "      VPS_HOST     → IP del servidor"
echo "      VPS_USER     → $DEPLOY_USER"
echo "      VPS_SSH_KEY  → clave privada RSA/Ed25519 (para GitHub Actions)"
echo "      DEPLOY_PATH  → $DEPLOY_PATH"
echo "      GHCR_TOKEN   → GitHub Personal Access Token (scope: read:packages)"
echo ""
echo " 4. Hacer push a main para triggear el primer deploy."
echo ""
echo " 5. (Opcional) Configurar HTTPS con Certbot:"
echo "      bash $DEPLOY_PATH/deploy/enable-ssl.sh tu-dominio.com tu@email.com"
echo ""
