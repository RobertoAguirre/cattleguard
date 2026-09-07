import 'package:flutter/material.dart';
import 'locale_controller.dart';

/// Simple EN/ES strings for CattleGuard UI.
class S {
  S._(this._en);
  final bool _en;

  factory S.of(BuildContext context) {
    final locale = Localizations.maybeLocaleOf(context) ?? const Locale('en');
    return S._(locale.languageCode == 'en');
  }

  factory S.fromController(LocaleController c) => S._(c.isEnglish);

  String get appTagline => _en
      ? 'Early disease detection in cattle'
      : 'Detección temprana de enfermedades en ganado';

  String get landingHeadline => _en
      ? 'Early disease detection in cattle'
      : 'Detección temprana de enfermedades en ganado';

  String get landingSub => _en
      ? 'AI that analyzes cattle images and flags disease signs or wounds — with priority screening for screwworm (New World screwworm) indicators.'
      : 'IA que analiza imágenes de tu ganado y te alerta sobre signos de enfermedad o heridas. Prioridad: indicadores de gusano barrenador.';

  String get tryDemo => _en ? 'Try demo now' : 'Probar demo ahora';
  String get loadingDemo => _en ? 'Loading demo…' : 'Cargando demo…';
  String get enterApp => _en ? 'Enter the app' : 'Entrar a la app';
  String get tryInSeconds =>
      _en ? 'Try the analysis in seconds' : 'Prueba el análisis en segundos';
  String get demoError =>
      _en ? 'Could not load the demo' : 'Error al cargar el demo';

  String get whatWeDetect =>
      _en ? 'What we can detect' : 'Qué podemos detectar';
  String get whatWeDetectSub => _en
      ? 'Basic screening from RGB photos today. Results are decision support — not a veterinary diagnosis.'
      : 'Cribado básico a partir de fotos RGB. Es apoyo a la decisión, no un diagnóstico veterinario.';

  String get priorityFocus => _en ? 'Priority focus' : 'Enfoque prioritario';
  String get screwwormTitle => _en
      ? 'Screwworm (New World screwworm)'
      : 'Gusano barrenador';
  String get screwwormDesc => _en
      ? 'Wound and lesion screening that helps flag animals that may need urgent inspection for myiasis.'
      : 'Cribado de heridas y lesiones para marcar animales que pueden requerir inspección urgente por miasis.';

  String get diseasesTitle =>
      _en ? 'Disease / condition signs' : 'Signos de enfermedad / padecimiento';
  String get woundsTitle =>
      _en ? 'Wounds & lesions' : 'Heridas y lesiones';

  List<String> get diseaseItems => _en
      ? const [
          'Lumpy skin disease (lumpy)',
          'Skin abnormalities',
          'Dermatitis',
          'Contagious ecthyma (orf)',
          'Respiratory signs / BRD complex',
          'General contagious / disease indicators',
        ]
      : const [
          'Dermatosis nodular (Lumpy)',
          'Alteraciones cutáneas',
          'Dermatitis',
          'Ectima contagioso',
          'Signos respiratorios / complejo BRD',
          'Indicadores generales de enfermedad contagiosa',
        ];

  List<String> get woundItems => _en
      ? const [
          'Pressure wounds',
          'Ulcers',
          'Orthopaedic / limb-area lesions',
          'Cuts, burns, scratches',
          'General open wounds',
        ]
      : const [
          'Heridas por presión',
          'Úlceras',
          'Lesiones ortopédicas / en extremidades',
          'Cortes, quemaduras, rasguños',
          'Heridas abiertas en general',
        ];

  String get comingSoonThermal => _en
      ? 'Coming next: FLIR thermal in the diagnosis loop for field stations.'
      : 'Próximo: temperatura FLIR en el diagnóstico para estaciones de campo.';

  String get homeScanTitle =>
      _en ? 'Scan cattle with the camera' : 'Escanea ganado con la cámara';
  String get homeScanSub => _en
      ? 'Take a photo or upload an image to detect disease signs.'
      : 'Toma una foto o sube una imagen para detectar signos de enfermedad.';
  String get openCamera => _en ? 'Open camera' : 'Abrir cámara';
  String get viewDemo =>
      _en ? 'View demo with sample image' : 'Ver demo con imagen de ejemplo';
  String get scanWithCamera =>
      _en ? 'Scan with camera' : 'Escanear con cámara';
  String get retry => _en ? 'Retry' : 'Reintentar';
  String get loadScansError =>
      _en ? 'Could not load scans' : 'Error al cargar escaneos';
  String scanN(int n) => _en ? 'Scan $n' : 'Escaneo $n';

  String get loginSubtitle => _en
      ? 'Cattle disease detection'
      : 'Detección de enfermedades en ganado';
  String get email => 'Email';
  String get password => _en ? 'Password' : 'Contraseña';
  String get signIn => _en ? 'Sign in' : 'Iniciar sesión';
  String get createAccount => _en ? 'Create account' : 'Crear cuenta';
  String get loginError =>
      _en ? 'Could not sign in' : 'Error al iniciar sesión';
  String get emailHint =>
      _en ? 'you@email.com' : 'ejemplo@correo.com';

  String get registerTitle => _en ? 'Create account' : 'Crear cuenta';
  String get name => _en ? 'Name' : 'Nombre';
  String get phone => _en ? 'Phone' : 'Teléfono';
  String get register => _en ? 'Register' : 'Registrarse';
  String get haveAccount =>
      _en ? 'I already have an account' : 'Ya tengo cuenta';
  String get registerError =>
      _en ? 'Could not register' : 'Error al registrarse';

  String get analyzePhoto => _en ? 'Analyze photo' : 'Analizar foto';
  String get takePhoto =>
      _en ? 'Take photo with camera' : 'Tomar foto con cámara';
  String get uploadGallery =>
      _en ? 'Upload from gallery' : 'Subir desde galería';
  String get gallery => _en ? 'Gallery' : 'Galería';
  String get camera => _en ? 'Camera' : 'Cámara';
  String get uploadHint => _en
      ? 'Upload a cattle photo (RGB). Optional: thermal image.'
      : 'Sube una foto del ganado (RGB). Opcional: imagen térmica.';
  String get betterDetection =>
      _en ? 'Better detection' : 'Mejor detección';
  String get tipsBody => _en
      ? '• One cow per photo (max 2–3 if close).\n'
          '• Prefer a side (profile) view.\n'
          '• Fill the frame with the animal or area to check.'
      : '• Una vaca por foto (máx. 2–3 si están cerca).\n'
          '• Preferir vista de lado (perfil).\n'
          '• Acercar para que el animal o la zona a revisar ocupe bien el encuadre.';
  String get rgbRequired =>
      _en ? 'RGB image (required)' : 'Imagen RGB (requerida)';
  String get thermalOptional =>
      _en ? 'Thermal image (optional)' : 'Imagen térmica (opcional)';
  String get tapToSelect =>
      _en ? 'Tap to select' : 'Toca para seleccionar';
  String get analyzing => _en ? 'Analyzing…' : 'Analizando…';
  String get analyzeThis =>
      _en ? 'Analyze this photo' : 'Analizar esta foto';
  String get firstTimeDemo => _en
      ? 'First time? Try the full flow with a sample image.'
      : '¿Primera vez? Prueba el flujo completo con una imagen de ejemplo.';
  String get viewDemoShort => _en ? 'View demo' : 'Ver demo';

  String get resultTitle =>
      _en ? 'Analysis result' : 'Resultado del análisis';
  String get confidence => _en ? 'Confidence' : 'Confianza';
  String get modelsAgree =>
      _en ? 'Both models agree' : 'Los dos modelos coinciden';
  String get generalDiagnosis =>
      _en ? 'Overall assessment' : 'Diagnóstico general';
  String woundsCount(int n) =>
      _en ? '$n wound(s)' : '$n herida(s)';
  String findingsCount(int n) =>
      _en ? '$n finding(s)' : '$n hallazgo(s)';
  String get diagnosesPrecision =>
      _en ? 'Findings with precision' : 'Diagnósticos con precisión';
  String precision(int p) =>
      _en ? 'Precision: $p%' : 'Precisión: $p%';
  String get symptoms =>
      _en ? 'Symptoms / signs:' : 'Síntomas / signos:';
  String get recommendation =>
      _en ? 'Recommendation:' : 'Recomendación:';
  String get indicators => _en ? 'Indicators' : 'Indicadores';
  String get back => _en ? 'Back' : 'Volver';
  String get disclaimer => _en
      ? 'AI-assisted result. Does not replace a veterinarian. Consult a professional for a definitive diagnosis.'
      : 'Resultado asistido por IA. No sustituye el criterio de un veterinario. Consulte a un profesional para el diagnóstico definitivo.';

  String woundLabel(String key) {
    const es = {
      'pressure-wound': 'Herida por presión',
      'wound-ulser': 'Úlcera',
      'orthopaedic-wounds': 'Lesión ortopédica',
      'wound': 'Herida',
      'cut': 'Corte',
      'burn': 'Quemadura',
      'scratch': 'Rasguño',
    };
    const en = {
      'pressure-wound': 'Pressure wound',
      'wound-ulser': 'Ulcer',
      'orthopaedic-wounds': 'Orthopaedic lesion',
      'wound': 'Wound',
      'cut': 'Cut',
      'burn': 'Burn',
      'scratch': 'Scratch',
    };
    return (_en ? en : es)[key] ?? key;
  }
}
