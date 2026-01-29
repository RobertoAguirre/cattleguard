import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _loading = false;
  String? _error;
  XFile? _rgbFile;
  XFile? _thermalFile;
  List<int>? _rgbPreviewBytes;
  List<int>? _thermalPreviewBytes;

  Future<void> _pickImage(bool isThermal) async {
    try {
      final source = await showModalBottomSheet<ImageSource>(
        context: context,
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Galería'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Cámara'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
            ],
          ),
        ),
      );
      if (source == null || !mounted) return;
      final file = await _picker.pickImage(source: source, imageQuality: 85);
      if (file != null && mounted) {
        final bytes = await file.readAsBytes();
        setState(() {
          if (isThermal) {
            _thermalFile = file;
            _thermalPreviewBytes = bytes;
          } else {
            _rgbFile = file;
            _rgbPreviewBytes = bytes;
          }
          _error = null;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _upload() async {
    if (_rgbFile == null) {
      setState(() => _error = 'Selecciona al menos la imagen RGB');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rgbBytes = await _rgbFile!.readAsBytes();
      List<int>? thermalBytes;
      if (_thermalFile != null) {
        thermalBytes = await _thermalFile!.readAsBytes();
      }
      final res = await ApiService.uploadScan(
        rgbBytes: rgbBytes,
        thermalBytes: thermalBytes,
        source: 'cattleguard_app',
      );
      final status = res['_status'] as int?;
      if (status == 201 && res['scan'] != null) {
        if (!mounted) return;
        Navigator.of(context).pop(res['scan']);
      } else {
        setState(() {
          _error = res['message'] as String? ?? res['error'] as String? ?? 'Error al subir';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analizar foto')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Sube una foto del ganado (RGB). Opcional: imagen térmica.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 12),
              Card(
                color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.lightbulb_outline, size: 18, color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 6),
                          Text(
                            'Mejor detección',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '• Una vaca por foto (máx. 2–3 si están cerca).\n'
                        '• Preferir vista de lado (perfil).\n'
                        '• Acercar para que el animal o la zona a revisar ocupe bien el encuadre.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _buildImageCard(
                title: 'Imagen RGB (requerida)',
                file: _rgbFile,
                previewBytes: _rgbPreviewBytes,
                onTap: () => _pickImage(false),
              ),
              const SizedBox(height: 16),
              _buildImageCard(
                title: 'Imagen térmica (opcional)',
                file: _thermalFile,
                previewBytes: _thermalPreviewBytes,
                onTap: () => _pickImage(true),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: _loading ? null : _upload,
                icon: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.cloud_upload),
                label: Text(_loading ? 'Analizando…' : 'Subir y analizar'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageCard({
    required String title,
    required XFile? file,
    required List<int>? previewBytes,
    required VoidCallback onTap,
  }) {
    Widget preview = Container(
      width: 80,
      height: 80,
      color: Colors.grey[300],
      child: const Icon(Icons.add_photo_alternate, size: 40),
    );
    if (file != null && previewBytes != null && previewBytes.isNotEmpty) {
      preview = Image(
        image: MemoryImage(Uint8List.fromList(previewBytes)),
        width: 80,
        height: 80,
        fit: BoxFit.cover,
      );
    }
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: preview,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      file != null ? file.name : 'Toca para seleccionar',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
