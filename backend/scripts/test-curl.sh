#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"
BASE_URL="http://localhost:3000"

echo -e "${CYAN}🚀 Iniciando pruebas de API con curl${NC}\n"

# 1. Health Check
echo -e "${CYAN}📋 1. Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Health Check: OK${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Health Check falló: HTTP $http_code${NC}"
fi
echo ""

# 2. Register
echo -e "${CYAN}📋 2. Registrar Usuario${NC}"
email="test_$(date +%s)@example.com"
register_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Usuario Prueba\",
    \"email\": \"$email\",
    \"password\": \"test123456\",
    \"phone\": \"+526141234567\",
    \"role\": \"rancher\",
    \"ranch\": {
      \"name\": \"Rancho Prueba\",
      \"location\": { \"lat\": 19.4326, \"lng\": -99.1332 },
      \"size\": 100
    }
  }")

http_code=$(echo "$register_response" | tail -n1)
body=$(echo "$register_response" | sed '$d')

if [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✅ Registro exitoso${NC}"
    TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    USER_ID=$(echo "$body" | jq -r '.user.id' 2>/dev/null)
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo -e "${RED}❌ No se obtuvo token${NC}"
        echo "$body"
        exit 1
    fi
    echo -e "${YELLOW}Token: ${TOKEN:0:30}...${NC}"
    echo "$body" | jq '.user' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Registro falló: HTTP $http_code${NC}"
    echo "$body"
    exit 1
fi
echo ""

# 3. Login
echo -e "${CYAN}📋 3. Login${NC}"
login_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$email\",
    \"password\": \"test123456\"
  }")

http_code=$(echo "$login_response" | tail -n1)
body=$(echo "$login_response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Login exitoso${NC}"
    TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    echo "$body" | jq '.user' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠️  Login falló: HTTP $http_code${NC}"
    echo "$body"
fi
echo ""

# 4. Get Me
echo -e "${CYAN}📋 4. Obtener Usuario Actual${NC}"
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No hay token, saltando...${NC}"
else
    me_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
      -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$me_response" | tail -n1)
    body=$(echo "$me_response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Usuario obtenido${NC}"
        echo "$body" | jq '.user' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Error: HTTP $http_code${NC}"
        echo "$body"
    fi
fi
echo ""

# 5. Create Scan (necesita imágenes)
echo -e "${CYAN}📋 5. Crear Escaneo${NC}"
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No hay token, saltando...${NC}"
else
    # Crear imágenes de prueba temporales (PNG mínimo válido)
    mkdir -p /tmp/test-images
    thermal_img="/tmp/test-images/thermal.png"
    rgb_img="/tmp/test-images/rgb.png"
    
    # PNG mínimo válido (1x1 pixel)
    echo -ne '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1F\x15\xC4\x89\x00\x00\x00\x0A\x49\x44\x41\x54\x78\x9C\x63\x00\x01\x00\x00\x05\x00\x01\x0D\x0A\x2D\xB4\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82' > "$thermal_img"
    cp "$thermal_img" "$rgb_img"
    
    scan_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/scans" \
      -H "Authorization: Bearer $TOKEN" \
      -F "thermal=@$thermal_img" \
      -F "rgb=@$rgb_img" \
      -F "lat=19.4326" \
      -F "lng=-99.1332" \
      -F "source=test_curl")
    
    http_code=$(echo "$scan_response" | tail -n1)
    body=$(echo "$scan_response" | sed '$d')
    
    if [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Escaneo creado${NC}"
        SCAN_ID=$(echo "$body" | jq -r '.scan._id' 2>/dev/null)
        echo "$body" | jq '.scan | {_id, status, classification: .aiResults.combined.classification, confidence: .aiResults.combined.confidence}' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Error al crear escaneo: HTTP $http_code${NC}"
        echo "$body"
    fi
    
    # Limpiar imágenes temporales
    rm -rf /tmp/test-images
fi
echo ""

# 6. Get Scans
echo -e "${CYAN}📋 6. Listar Escaneos${NC}"
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No hay token, saltando...${NC}"
else
    scans_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/scans" \
      -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$scans_response" | tail -n1)
    body=$(echo "$scans_response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Escaneos obtenidos${NC}"
        count=$(echo "$body" | jq -r '.count' 2>/dev/null)
        echo -e "${YELLOW}Total: $count escaneos${NC}"
        echo "$body" | jq '.scans[0] | {_id, status, classification: .aiResults.combined.classification}' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Error: HTTP $http_code${NC}"
        echo "$body"
    fi
fi
echo ""

# 7. Get Scan by ID
echo -e "${CYAN}📋 7. Obtener Escaneo por ID${NC}"
if [ -z "$TOKEN" ] || [ -z "$SCAN_ID" ]; then
    echo -e "${YELLOW}⚠️  No hay token o scanId, saltando...${NC}"
else
    scan_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/scans/$SCAN_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$scan_response" | tail -n1)
    body=$(echo "$scan_response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Escaneo obtenido${NC}"
        echo "$body" | jq '.scan | {_id, status, classification: .aiResults.combined.classification, confidence: .aiResults.combined.confidence}' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Error: HTTP $http_code${NC}"
        echo "$body"
    fi
fi
echo ""

echo -e "${CYAN}✅ Pruebas completadas${NC}"

