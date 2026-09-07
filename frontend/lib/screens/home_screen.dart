import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../l10n/app_strings.dart';
import '../services/api_service.dart';
import '../widgets/language_toggle.dart';
import 'login_screen.dart';
import 'upload_screen.dart';
import 'scan_result_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _scans = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadScans();
  }

  Future<void> _loadScans() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiService.getScans();
      final status = res['_status'] as int?;
      if (status == 200 && res['scans'] != null) {
        setState(() {
          _scans = res['scans'] as List<dynamic>;
          _loading = false;
        });
      } else {
        setState(() {
          _error = res['message'] as String? ??
              (ApiService.lang == 'en'
                  ? 'Could not load scans'
                  : 'Error al cargar escaneos');
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _logout() async {
    ApiService.setToken(null);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _openUpload({bool cameraFirst = true}) async {
    final navigator = Navigator.of(context);
    final result = await navigator.push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => UploadScreen(openCameraFirst: cameraFirst),
      ),
    );
    if (!mounted) return;
    if (result != null) {
      navigator.push(
        MaterialPageRoute(
          builder: (_) => ScanResultScreen(scan: result),
        ),
      );
    }
    _loadScans();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('CattleGuard'),
        actions: [
          const LanguageToggle(compact: true),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _loadScans,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _loadScans,
                        child: Text(s.retry),
                      ),
                    ],
                  ),
                )
              : _scans.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt_outlined,
                                size: 72,
                                color: Theme.of(context)
                                    .colorScheme
                                    .primary
                                    .withValues(alpha: 0.8)),
                            const SizedBox(height: 24),
                            Text(
                              s.homeScanTitle,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              s.homeScanSub,
                              style: TextStyle(color: Colors.grey[600]),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            FilledButton.icon(
                              onPressed: () => _openUpload(cameraFirst: true),
                              icon: const Icon(Icons.camera_alt),
                              label: Text(s.openCamera),
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 16),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextButton.icon(
                              onPressed: () async {
                                setState(() => _loading = true);
                                final navigator = Navigator.of(context);
                                try {
                                  final bytes = (await http.get(Uri.parse(
                                    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800',
                                  )))
                                      .bodyBytes;
                                  final res = await ApiService.uploadScan(
                                    rgbBytes: bytes,
                                    thermalBytes: bytes,
                                    source: 'demo',
                                  );
                                  if (!mounted) return;
                                  if (res['_status'] == 201 &&
                                      res['scan'] != null) {
                                    navigator.push(
                                      MaterialPageRoute(
                                        builder: (_) => ScanResultScreen(
                                          scan: res['scan']
                                              as Map<String, dynamic>,
                                        ),
                                      ),
                                    );
                                    _loadScans();
                                  }
                                } catch (_) {}
                                if (mounted) {
                                  setState(() => _loading = false);
                                }
                              },
                              icon: const Icon(Icons.play_circle_outline,
                                  size: 20),
                              label: Text(s.viewDemo),
                            ),
                          ],
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadScans,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _scans.length,
                        itemBuilder: (context, i) {
                          final scan = _scans[i] as Map<String, dynamic>;
                          final summary = scan['aiResults']?['combined']
                              ?['summary'] as Map<String, dynamic>?;
                          final status = summary?['statusLabel'] ?? '—';
                          final message = summary?['message'] ?? '';
                          final statusColor = _statusColor(summary?['status']);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor:
                                    statusColor.withValues(alpha: 0.2),
                                child:
                                    Icon(Icons.analytics, color: statusColor),
                              ),
                              title: Text(s.scanN(i + 1)),
                              subtitle: Text(
                                '$status · $message',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        ScanResultScreen(scan: scan),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
                    ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openUpload(cameraFirst: true),
        icon: const Icon(Icons.camera_alt),
        label: Text(s.scanWithCamera),
      ),
    );
  }

  Color _statusColor(dynamic status) {
    switch (status) {
      case 'critical':
        return Colors.red;
      case 'suspicious':
        return Colors.orange;
      case 'healthy':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
