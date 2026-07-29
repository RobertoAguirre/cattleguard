import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'scan_result_screen.dart';
import 'home_screen.dart';

const String _kDemoImageUrl =
    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  bool _demoLoading = false;
  String? _demoError;

  Future<void> _runDemo() async {
    setState(() {
      _demoLoading = true;
      _demoError = null;
    });
    try {
      final bytes = (await http.get(Uri.parse(_kDemoImageUrl))).bodyBytes;
      final res = await ApiService.uploadScan(
        rgbBytes: bytes,
        thermalBytes: bytes,
        source: 'demo',
      );
      if (!mounted) return;
      if (res['_status'] == 201 && res['scan'] != null) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ScanResultScreen(
              scan: res['scan'] as Map<String, dynamic>,
            ),
          ),
        );
      } else {
        setState(() {
          _demoError = res['message'] as String? ?? 'Error al cargar el demo';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _demoError = e.toString());
      }
    } finally {
      if (mounted) setState(() => _demoLoading = false);
    }
  }

  void _goToApp() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: Stack(
        children: [
          // Fondo con gradiente y textura
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    colorScheme.primaryContainer.withValues(alpha: 0.4),
                    colorScheme.surface,
                    colorScheme.tertiaryContainer.withValues(alpha: 0.25),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          // Círculos decorativos
          Positioned(
            top: -120,
            right: -80,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colorScheme.primary.withValues(alpha: 0.12),
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -60,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colorScheme.tertiary.withValues(alpha: 0.1),
              ),
            ),
          ),
          // Contenido
          SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 32),
                        // Logo / marca
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: ColoredBox(
                            color: colorScheme.primaryContainer,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.health_and_safety_rounded,
                                    size: 28,
                                    color: colorScheme.onPrimaryContainer,
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    'CattleGuard',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: colorScheme.onPrimaryContainer,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 48),
                        // Hero headline
                        ShaderMask(
                          blendMode: BlendMode.srcIn,
                          shaderCallback: (bounds) => LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              colorScheme.primary,
                              colorScheme.tertiary,
                            ],
                          ).createShader(bounds),
                          child: Text(
                            'Detección temprana de enfermedades en ganado',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              height: 1.2,
                              letterSpacing: -0.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'IA que analiza imágenes de tu ganado y te alerta sobre signos de enfermedad o heridas. Menos pérdidas, más tranquilidad.',
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const Spacer(),
                        // Ilustración / icono grande
                        Icon(
                          Icons.photo_camera_front_rounded,
                          size: 100,
                          color: colorScheme.primary.withValues(alpha: 0.6),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Prueba el análisis en segundos',
                          style: theme.textTheme.titleSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Botón principal: Probar demo
                        FilledButton.icon(
                          onPressed: _demoLoading ? null : _runDemo,
                          icon: _demoLoading
                              ? SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: colorScheme.onPrimary,
                                  ),
                                )
                              : const Icon(Icons.play_arrow_rounded, size: 26),
                          label: Text(
                            _demoLoading ? 'Cargando demo…' : 'Probar demo ahora',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              vertical: 20,
                              horizontal: 32,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                        if (_demoError != null) ...[
                          const SizedBox(height: 12),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              _demoError!,
                              style: TextStyle(
                                color: colorScheme.error,
                                fontSize: 13,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed: _goToApp,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              vertical: 16,
                              horizontal: 28,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text('Entrar a la app'),
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
