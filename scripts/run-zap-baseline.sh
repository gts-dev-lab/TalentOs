#!/usr/bin/env bash
# TT-113: Escaneo OWASP ZAP baseline. Ejecutar con la app levantada (ej. npm run dev).
# Uso: ./scripts/run-zap-baseline.sh [URL]
#      ./scripts/run-zap-baseline.sh https://staging.talentos.example.com

set -e
URL="${1:-http://localhost:3000}"
echo "ZAP baseline scan target: $URL"
echo "Asegúrate de que la aplicación esté corriendo en esa URL."
docker run --rm -t owasp/zap2docker-stable zap-baseline.py -t "$URL" -I
