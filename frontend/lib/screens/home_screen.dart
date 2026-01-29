import 'package:flutter/material.dart';
import '../services/api_service.dart';
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
          _error = res['message'] as String? ?? 'Error al cargar escaneos';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CattleGuard'),
        actions: [
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
                        child: const Text('Reintentar'),
                      ),
                    ],
                  ),
                )
              : _scans.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.photo_camera_outlined,
                              size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'Sin escaneos aún',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Toca el botón + para analizar una foto',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadScans,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _scans.length,
                        itemBuilder: (context, i) {
                          final scan = _scans[i] as Map<String, dynamic>;
                          final summary = scan['aiResults']?['combined']?['summary']
                              as Map<String, dynamic>?;
                          final status = summary?['statusLabel'] ?? '—';
                          final message = summary?['message'] ?? '';
                          final statusColor = _statusColor(summary?['status']);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: statusColor.withValues(alpha: 0.2),
                                child: Icon(Icons.analytics, color: statusColor),
                              ),
                              title: Text('Escaneo ${i + 1}'),
                              subtitle: Text(
                                '$status · $message',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => ScanResultScreen(scan: scan),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
                    ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final navigator = Navigator.of(context);
          final result = await navigator.push<Map<String, dynamic>>(
            MaterialPageRoute(builder: (_) => const UploadScreen()),
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
        },
        icon: const Icon(Icons.add_a_photo),
        label: const Text('Analizar foto'),
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
