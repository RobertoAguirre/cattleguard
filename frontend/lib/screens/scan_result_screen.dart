import 'package:flutter/material.dart';

class ScanResultScreen extends StatelessWidget {
  final Map<String, dynamic> scan;

  const ScanResultScreen({super.key, required this.scan});

  @override
  Widget build(BuildContext context) {
    final combined = scan['aiResults']?['combined'] as Map<String, dynamic>?;
    final summary = combined?['summary'] as Map<String, dynamic>?;
    final status = summary?['status'] ?? 'healthy';
    final statusLabel = summary?['statusLabel'] ?? '—';
    final message = summary?['message'] ?? '';
    final indicators = summary?['indicators'] as List<dynamic>? ?? [];
    final woundsCount = summary?['woundsCount'] ?? 0;
    final diseasesCount = summary?['diseasesCount'] ?? 0;
    final confidencePercent = summary?['confidencePercent'] ?? '—';

    final statusColor = _colorForStatus(status);
    final images = scan['images'] as Map<String, dynamic>?;
    final rgbUrl = images?['rgb'] as String?;

    return Scaffold(
      appBar: AppBar(title: const Text('Resultado del análisis')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (rgbUrl != null && rgbUrl.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  rgbUrl,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox(
                    height: 200,
                    child: Center(child: Icon(Icons.broken_image, size: 48)),
                  ),
                ),
              ),
            const SizedBox(height: 20),
            Card(
              color: statusColor.withValues(alpha: 0.15),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.analytics, size: 40, color: statusColor),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            statusLabel,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: statusColor,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(message),
                          const SizedBox(height: 4),
                          Text(
                            'Confianza: $confidencePercent',
                            style: TextStyle(color: Colors.grey[700], fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (woundsCount > 0 || diseasesCount > 0) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  if (woundsCount > 0)
                    Chip(
                      avatar: const Icon(Icons.warning_amber, color: Colors.white, size: 18),
                      label: Text('$woundsCount herida(s)'),
                      backgroundColor: Colors.red.shade100,
                    ),
                  const SizedBox(width: 8),
                  if (diseasesCount > 0)
                    Chip(
                      avatar: const Icon(Icons.medical_services, color: Colors.white, size: 18),
                      label: Text('$diseasesCount hallazgo(s)'),
                      backgroundColor: Colors.orange.shade100,
                    ),
                ],
              ),
            ],
            if (indicators.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text(
                'Indicadores',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: indicators.map<Widget>((e) {
                  final map = e as Map<String, dynamic>;
                  final label = map['label'] as String? ?? '';
                  final value = map['value'] as String? ?? '';
                  final severity = map['severity'] as String? ?? '';
                  final color = _colorForSeverity(severity);
                  return Chip(
                    backgroundColor: color.withValues(alpha: 0.2),
                    side: BorderSide(color: color),
                    label: Text('$label $value'),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Volver'),
            ),
          ],
        ),
      ),
    );
  }

  Color _colorForStatus(String status) {
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

  Color _colorForSeverity(String severity) {
    switch (severity) {
      case 'critical':
        return Colors.red;
      case 'suspicious':
        return Colors.orange;
      case 'low':
        return Colors.grey;
      case 'healthy':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
