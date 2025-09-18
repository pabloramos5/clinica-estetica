#!/bin/bash

echo "🧪 Probando Sistema de Autenticación"
echo "===================================="

# URL base
BASE_URL="http://localhost:3001/api"

# 1. Registrar un nuevo usuario
echo ""
echo "1️⃣ Registrando nuevo usuario..."
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@clinica.com",
    "password": "test123",
    "role": "RECEPCION"
  }' | json_pp

echo ""
echo "2️⃣ Haciendo login..."
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@clinica.com",
    "password": "test123"
  }')

echo $RESPONSE | json_pp

# Extraer el token
TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  exit 1
fi

echo ""
echo "3️⃣ Token obtenido: ${TOKEN:0:50}..."

echo ""
echo "4️⃣ Obteniendo perfil con token..."
curl -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" | json_pp

echo ""
echo "✅ Pruebas completadas!"