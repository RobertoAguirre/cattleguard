import 'package:flutter/material.dart';
import '../l10n/app_strings.dart';
import '../widgets/language_toggle.dart';

class ScanResultScreen extends StatelessWidget {
  final Map<String, dynamic> scan;

  const ScanResultScreen({super.key, required this.scan});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final combined = scan['aiResults']?['combined'] as Map<String, dynamic>?;
    final summary = combined?['summary'] as Map<String, dynamic>?;
    final status = summary?['status'] ?? 'healthy';
    final statusLabel = summary?['statusLabel'] ?? '—';
    final message = summary?['message'] ?? '';
    final diagnosticoGeneral = summary?['diagnosticoGeneral'] as String?;
    final indicators = summary?['indicators'] as List<dynamic>? ?? [];
    final diagnoses = summary?['diagnoses'] as List<dynamic>? ?? [];
    final woundsCount = summary?['woundsCount'] ?? 0;
    final diseasesCount = summary?['diseasesCount'] ?? 0;
    final confidencePercent = summary?['confidencePercent'] ?? '—';
    final modelsAgree = summary?['modelsAgree'] as bool? ?? false;

    final statusColor = _colorForStatus(status);
    final images = scan['images'] as Map<String, dynamic>?;
    final rgbUrl = images?['rgb'] as String?;
    final wounds = combined?['wounds'] as List<dynamic>? ?? [];
    final imageDimensions = combined?['imageDimensions'] as Map<String, dynamic>?;
    final imgW = (imageDimensions?['width'] as num?)?.toDouble() ?? 640.0;
    final imgH = (imageDimensions?['height'] as num?)?.toDouble() ?? 640.0;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.resultTitle),
        actions: const [LanguageToggle(compact: true)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (rgbUrl != null && rgbUrl.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  height: 360,
                  width: double.infinity,
                  child: _ImageWithOverlays(
                    imageUrl: rgbUrl,
                    wounds: wounds,
                    imageWidth: imgW,
                    imageHeight: imgH,
                    labelFor: s.woundLabel,
                  ),
                ),
              ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: statusColor.withValues(alpha: 0.5), width: 2),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(_iconForStatus(status), size: 36, color: statusColor),
                      const SizedBox(width: 12),
                      Text(
                        statusLabel,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: statusColor,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${s.confidence}: $confidencePercent',
                    style: TextStyle(color: Colors.grey[700], fontSize: 13),
                  ),
                  if (modelsAgree) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline, size: 18, color: Colors.green[700]),
                        const SizedBox(width: 6),
                        Text(
                          s.modelsAgree,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.green[800],
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            if (diagnosticoGeneral != null && diagnosticoGeneral.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                s.generalDiagnosis,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    diagnosticoGeneral,
                    style: const TextStyle(height: 1.5, fontSize: 14),
                  ),
                ),
              ),
            ],
            if (woundsCount > 0 || diseasesCount > 0) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  if (woundsCount > 0)
                    Chip(
                      avatar: const Icon(Icons.warning_amber, color: Colors.white, size: 18),
                      label: Text(s.woundsCount(woundsCount is int ? woundsCount : int.tryParse('$woundsCount') ?? 0)),
                      backgroundColor: Colors.red.shade100,
                    ),
                  const SizedBox(width: 8),
                  if (diseasesCount > 0)
                    Chip(
                      avatar: const Icon(Icons.medical_services, color: Colors.white, size: 18),
                      label: Text(s.findingsCount(diseasesCount is int ? diseasesCount : int.tryParse('$diseasesCount') ?? 0)),
                      backgroundColor: Colors.orange.shade100,
                    ),
                ],
              ),
            ],
            if (diagnoses.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                s.diagnosesPrecision,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              ...diagnoses.map<Widget>((e) {
                final map = e as Map<String, dynamic>;
                final type = map['type'] as String? ?? '';
                final diagnosisLabel = map['diagnosisLabel'] as String? ?? '';
                final precisionPercent = map['precisionPercent'] as int? ?? 0;
                final symptoms = map['symptoms'] as String? ?? '';
                final recommendation = map['recommendation'] as String? ?? '';
                final severity = map['severity'] as String? ?? '';
                final color = _colorForSeverity(severity);
                if (type == 'healthy') {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    color: color.withValues(alpha: 0.08),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.check_circle, color: color, size: 22),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  diagnosisLabel,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: color,
                                  ),
                                ),
                              ),
                              Text(
                                s.precision(precisionPercent),
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: color,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          if (symptoms.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(symptoms, style: TextStyle(fontSize: 13, color: Colors.grey[800])),
                          ],
                        ],
                      ),
                    ),
                  );
                }
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: color.withValues(alpha: 0.08),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              type == 'wound' ? Icons.warning_amber : Icons.medical_services,
                              color: color,
                              size: 22,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                diagnosisLabel,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                s.precision(precisionPercent),
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: color,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (symptoms.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            s.symptoms,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            symptoms,
                            style: TextStyle(fontSize: 13, height: 1.4, color: Colors.grey[800]),
                          ),
                        ],
                        if (recommendation.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            s.recommendation,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            recommendation,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: Colors.grey[800],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ],
            if (indicators.isNotEmpty && diagnoses.isEmpty) ...[
              const SizedBox(height: 20),
              Text(s.indicators, style: Theme.of(context).textTheme.titleMedium),
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
              label: Text(s.back),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 20, color: Colors.grey[700]),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      s.disclaimer,
                      style: TextStyle(fontSize: 12, color: Colors.grey[800], height: 1.4),
                    ),
                  ),
                ],
              ),
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

  IconData _iconForStatus(String status) {
    switch (status) {
      case 'critical':
        return Icons.warning_amber_rounded;
      case 'suspicious':
        return Icons.info_outline_rounded;
      case 'healthy':
        return Icons.check_circle_rounded;
      default:
        return Icons.help_outline_rounded;
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

class _ImageWithOverlays extends StatelessWidget {
  final String imageUrl;
  final List<dynamic> wounds;
  final double imageWidth;
  final double imageHeight;
  final String Function(String key) labelFor;

  const _ImageWithOverlays({
    required this.imageUrl,
    required this.wounds,
    required this.imageWidth,
    required this.imageHeight,
    required this.labelFor,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cw = constraints.maxWidth;
        final ch = constraints.maxHeight;
        final scale = (cw / imageWidth) < (ch / imageHeight) ? cw / imageWidth : ch / imageHeight;
        final dispW = imageWidth * scale;
        final dispH = imageHeight * scale;
        final offsetX = (cw - dispW) / 2;
        final offsetY = (ch - dispH) / 2;

        return Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) =>
                    const Center(child: Icon(Icons.broken_image, size: 48)),
              ),
            ),
            if (wounds.isNotEmpty)
              ...wounds.map<Widget>((wound) {
                final map = wound as Map<String, dynamic>;
                final x = (map['x'] as num?)?.toDouble() ?? 0.0;
                final y = (map['y'] as num?)?.toDouble() ?? 0.0;
                final widthPx = (map['width'] as num?)?.toDouble() ?? 0.0;
                final heightPx = (map['height'] as num?)?.toDouble() ?? 0.0;
                final confidence = (map['confidence'] as num?)?.toDouble() ?? 0.0;
                final classKey = map['class'] as String? ?? 'wound';
                final label = labelFor(classKey);
                final left = x - widthPx / 2;
                final top = y - heightPx / 2;
                final leftD = offsetX + left * scale;
                final topD = offsetY + top * scale;
                final widthD = widthPx * scale;
                final heightD = heightPx * scale;
                final color = confidence > 0.6 ? Colors.red : Colors.orange;
                return Positioned(
                  left: leftD,
                  top: topD,
                  width: widthD,
                  height: heightD,
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: color, width: 2.5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.9),
                          borderRadius: const BorderRadius.only(
                            bottomRight: Radius.circular(4),
                          ),
                        ),
                        child: Text(
                          '$label ${(confidence * 100).toInt()}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
          ],
        );
      },
    );
  }
}
