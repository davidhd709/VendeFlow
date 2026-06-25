#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VentasFlow — Activar HTTPS con Certbot (Let's Encrypt)
# Ejecutar en el VPS DESPUÉS del primer deploy HTTP exitoso:
#   bash /opt/ventasflow/deploy/enable-ssl.sh tudominio.com tu@email.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:?Uso: $0 <dominio> <email>}"
EMAIL="${2:?Uso: $0 <dominio> <email>}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/ingenierohenry/ventasflow}"

echo "═══════════════════════════════════════════════"
echo " VentasFlow — Enable HTTPS"
echo " Dominio : $DOMAIN"
echo " Email   : $EMAIL"
echo "═══════════════════════════════════════════════"

# 1. Obtener certificado (modo standalone — detiene nginx temporalmente)
echo "→ Obteniendo certificado Let's Encrypt..."
docker compose -f "$DEPLOY_PATH/docker-compose.prod.yml" \
  --env-file "$DEPLOY_PATH/.env.prod" \
  --env-file "$DEPLOY_PATH/.env.deploy" \
  stop frontend

certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domains "$DOMAIN" \
  --keep-until-expiring

# 2. Reemplazar el dominio en la config SSL
echo "→ Configurando nginx.ssl.conf para $DOMAIN..."
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" \
  "$DEPLOY_PATH/deploy/nginx.ssl.conf" \
  > /tmp/nginx.ssl.current.conf

# 3. Activar la config SSL, puertos y volúmenes en docker-compose
echo "→ Activando HTTPS en docker-compose.prod.yml..."
# Descomentar los volúmenes y puerto 443 (edición in-place)
sed -i \
  -e 's|# *- "443:443"|- "443:443"|' \
  -e 's|# *- /etc/letsencrypt:/etc/letsencrypt:ro|- /etc/letsencrypt:/etc/letsencrypt:ro|' \
  -e 's|# *- certbot-www:/var/www/certbot:ro|- certbot-www:/var/www/certbot:ro|' \
  -e 's|# *- \./deploy/nginx\.ssl\.conf:.*|- ./deploy/nginx.ssl.conf.current:/etc/nginx/conf.d/default.conf:ro|' \
  -e 's|# *certbot-www:|  certbot-www:|' \
  "$DEPLOY_PATH/docker-compose.prod.yml"

# Copiar la config rellena con el dominio real
cp /tmp/nginx.ssl.current.conf "$DEPLOY_PATH/deploy/nginx.ssl.conf.current"

# 4. Levantar con la nueva config
echo "→ Reiniciando con HTTPS..."
docker compose -f "$DEPLOY_PATH/docker-compose.prod.yml" \
  --env-file "$DEPLOY_PATH/.env.prod" \
  --env-file "$DEPLOY_PATH/.env.deploy" \
  up -d frontend

# 5. Crear cron para renovación automática
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  echo "→ Configurando renovación automática (cron)..."
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $DEPLOY_PATH/docker-compose.prod.yml --env-file $DEPLOY_PATH/.env.prod --env-file $DEPLOY_PATH/.env.deploy restart frontend") | crontab -
fi

echo ""
echo "═══════════════════════════════════════════════"
echo " ✅ HTTPS activado"
echo " → https://$DOMAIN"
echo "═══════════════════════════════════════════════"
