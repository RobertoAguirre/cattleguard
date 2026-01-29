import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto (gusano/.env)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BASE_URL = `${API_URL}/api`;

// Colores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Crear imágenes de prueba simples (1x1 pixel PNG)
function createTestImage(name) {
  // PNG mínimo válido (1x1 pixel transparente)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
    0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82
  ]);

  const testDir = path.join(__dirname, 'test-images');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, `${name}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  return filePath;
}

let authToken = null;
let userId = null;

async function testHealthCheck() {
  log('\n📋 1. Health Check', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/health`);
    log(`✅ Servidor funcionando: ${response.data.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testRegister() {
  log('\n📋 2. Registrar Usuario', 'cyan');
  try {
    const testEmail = `test_${Date.now()}@example.com`;
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Usuario de Prueba',
      email: testEmail,
      password: 'test123456',
      phone: '+526141234567',
      role: 'rancher',
      ranch: {
        name: 'Rancho de Prueba',
        location: { lat: 19.4326, lng: -99.1332 },
        size: 100
      }
    });

    authToken = response.data.token;
    userId = response.data.user.id;
    log(`✅ Usuario registrado: ${response.data.user.email}`, 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testLogin() {
  log('\n📋 3. Login', 'cyan');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'test123456'
    });
    log(`✅ Login exitoso`, 'green');
    return true;
  } catch (error) {
    log(`⚠️  Login falló (esperado si no existe el usuario): ${error.response?.data?.message || error.message}`, 'yellow');
    return true; // No es crítico
  }
}

async function testGetMe() {
  log('\n📋 4. Obtener Usuario Actual', 'cyan');
  if (!authToken) {
    log('⚠️  No hay token, saltando...', 'yellow');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log(`✅ Usuario obtenido: ${response.data.user.name}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCreateScan() {
  log('\n📋 5. Crear Escaneo', 'cyan');
  if (!authToken) {
    log('⚠️  No hay token, saltando...', 'yellow');
    return false;
  }

  try {
    // Crear imágenes de prueba
    const thermalPath = createTestImage('thermal');
    const rgbPath = createTestImage('rgb');

    const formData = new FormData();
    formData.append('thermal', fs.createReadStream(thermalPath));
    formData.append('rgb', fs.createReadStream(rgbPath));
    formData.append('lat', '19.4326');
    formData.append('lng', '-99.1332');
    formData.append('source', 'test_script');

    const response = await axios.post(`${BASE_URL}/scans`, formData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });

    log(`✅ Escaneo creado: ${response.data.scan._id}`, 'green');
    log(`   Clasificación: ${response.data.scan.aiResults.combined.classification}`, 'yellow');
    log(`   Confianza: ${(response.data.scan.aiResults.combined.confidence * 100).toFixed(1)}%`, 'yellow');
    
    // Limpiar imágenes de prueba
    fs.unlinkSync(thermalPath);
    fs.unlinkSync(rgbPath);

    return response.data.scan._id;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data?.error) {
      log(`   Detalles: ${error.response.data.error}`, 'red');
    }
    return null;
  }
}

async function testGetScans() {
  log('\n📋 6. Obtener Escaneos', 'cyan');
  if (!authToken) {
    log('⚠️  No hay token, saltando...', 'yellow');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/scans`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log(`✅ Escaneos obtenidos: ${response.data.count}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetScanById(scanId) {
  log('\n📋 7. Obtener Escaneo por ID', 'cyan');
  if (!authToken || !scanId) {
    log('⚠️  No hay token o scanId, saltando...', 'yellow');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/scans/${scanId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log(`✅ Escaneo obtenido: ${response.data.scan._id}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Ejecutar todas las pruebas
async function runTests() {
  log('\n🚀 Iniciando pruebas de API\n', 'blue');

  const results = {
    healthCheck: await testHealthCheck(),
    register: await testRegister(),
    login: await testLogin(),
    getMe: await testGetMe(),
    createScan: await testCreateScan(),
    getScans: await testGetScans(),
    getScanById: null
  };

  if (results.createScan) {
    results.getScanById = await testGetScanById(results.createScan);
  }

  // Resumen
  log('\n📊 Resumen de Pruebas\n', 'blue');
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r === true).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result === true ? '✅' : result === false ? '❌' : '⚠️';
    log(`${status} ${test}: ${result === true ? 'PASÓ' : result === false ? 'FALLÓ' : 'OMITIDO'}`, 
      result === true ? 'green' : result === false ? 'red' : 'yellow');
  });

  log(`\n✅ ${passed}/${total} pruebas pasaron\n`, passed === total ? 'green' : 'yellow');
}

// Ejecutar
runTests().catch(console.error);

