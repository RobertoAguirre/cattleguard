import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@cattleguard.app';
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demo123';

/**
 * Middleware opcional: con token usa el usuario del JWT; sin token usa usuario "demo".
 * Útil para desarrollo / pruebas sin login en el frontend.
 */
export async function optionalAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (_) {
        // Token inválido, continuar como demo
      }
    }

    // Sin token o inválido: usar usuario demo (crear si no existe)
    let user = await User.findOne({ email: DEMO_EMAIL }).select('-password');
    if (!user) {
      await User.create({
        name: 'Demo',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        phone: '+0000000000'
      });
      user = await User.findOne({ email: DEMO_EMAIL }).select('-password');
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: error.message
    });
  }
}

/**
 * Middleware para proteger rutas - verifica JWT
 */
export async function protect(req, res, next) {
  try {
    let token;

    // Obtener token del header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }

    try {
      // Verificar que JWT_SECRET existe
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor'
        });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Obtener usuario (sin password)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Adjuntar usuario al request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: error.message
    });
  }
}

