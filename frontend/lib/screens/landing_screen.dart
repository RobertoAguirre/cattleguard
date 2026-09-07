import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../l10n/app_strings.dart';
import '../services/api_service.dart';
import '../widgets/language_toggle.dart';
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
    final s = S.of(context);
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
          _demoError = res['message'] as String? ?? s.demoError;
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
    final s = S.of(context);

    return Scaffold(
      body: Stack(
        children: [
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
          SafeArea(
            child: CustomScrollView(
              slivers: [
                // language toggle
                SliverToBoxAdapter(
                  child: const Padding(
                    padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: Row(
                      children: [
                        Spacer(),
                        LanguageToggle(),
                      ],
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      const SizedBox(height: 16),
                      Center(
                        child: ClipRRect(
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
                      ),
                      const SizedBox(height: 36),
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
                          s.landingHeadline,
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
                        s.landingSub,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 28),
                      Icon(
                        Icons.photo_camera_front_rounded,
                        size: 88,
                        color: colorScheme.primary.withValues(alpha: 0.6),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        s.tryInSeconds,
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
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
                          _demoLoading ? s.loadingDemo : s.tryDemo,
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
                        Text(
                          _demoError!,
                          style: TextStyle(
                            color: colorScheme.error,
                            fontSize: 13,
                          ),
                          textAlign: TextAlign.center,
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
                        child: Text(s.enterApp),
                      ),
                      const SizedBox(height: 36),
                      _DetectSection(s: s, colorScheme: colorScheme, theme: theme),
                      const SizedBox(height: 40),
                    ]),
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

class _DetectSection extends StatelessWidget {
  const _DetectSection({
    required this.s,
    required this.colorScheme,
    required this.theme,
  });

  final S s;
  final ColorScheme colorScheme;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          s.whatWeDetect,
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          s.whatWeDetectSub,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
            height: 1.4,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Card(
          color: colorScheme.primaryContainer.withValues(alpha: 0.55),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.priorityFocus.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  s.screwwormTitle,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  s.screwwormDesc,
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        _ListCard(
          title: s.diseasesTitle,
          items: s.diseaseItems,
          icon: Icons.medical_services_outlined,
        ),
        const SizedBox(height: 12),
        _ListCard(
          title: s.woundsTitle,
          items: s.woundItems,
          icon: Icons.healing_outlined,
        ),
        const SizedBox(height: 12),
        Text(
          s.comingSoonThermal,
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            fontStyle: FontStyle.italic,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _ListCard extends StatelessWidget {
  const _ListCard({
    required this.title,
    required this.items,
    required this.icon,
  });

  final String title;
  final List<String> items;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('•  ', style: TextStyle(color: theme.colorScheme.primary)),
                    Expanded(
                      child: Text(item, style: theme.textTheme.bodyMedium),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
