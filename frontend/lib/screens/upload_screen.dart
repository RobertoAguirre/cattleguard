import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import '../l10n/app_strings.dart';
import '../services/api_service.dart';
import '../widgets/language_toggle.dart';

const String kDemoImageUrl =
    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key, this.openCameraFirst = false});

  final bool openCameraFirst;

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

  @override
  void initState() {
    super.initState();
    if (widget.openCameraFirst) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _openCameraDirect());
    }
  }

  Future<void> _openCameraDirect() async {
    try {
      final file = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      if (file != null && mounted) {
        final bytes = await file.readAsBytes();
        setState(() {
          _rgbFile = file;
          _rgbPreviewBytes = bytes;
          _thermalFile = null;
          _thermalPreviewBytes = null;
          _error = null;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _pickImage(bool isThermal) async {
    final s = S.of(context);
    try {
      final source = await showModalBottomSheet<ImageSource>(
        context: context,
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: Text(s.gallery),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: Text(s.camera),
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

  Future<void> _runDemo() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await http.get(Uri.parse(kDemoImageUrl));
      if (response.statusCode != 200) {
        throw Exception(ApiService.lang == 'en'
            ? 'Could not load demo image'
            : 'No se pudo cargar la imagen de demo');
      }
      final rgbBytes = response.bodyBytes;
      final res = await ApiService.uploadScan(
        rgbBytes: rgbBytes,
        thermalBytes: rgbBytes,
        source: 'demo',
      );
      final status = res['_status'] as int?;
      if (status == 201 && res['scan'] != null && mounted) {
        Navigator.of(context).pop(res['scan']);
      } else {
        setState(() {
          _error = res['message'] as String? ??
              res['error'] as String? ??
              (ApiService.lang == 'en' ? 'Demo error' : 'Error en demo');
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

  Future<void> _upload() async {
    if (_rgbFile == null) {
      setState(() => _error = ApiService.lang == 'en'
          ? 'Select at least the RGB image'
          : 'Selecciona al menos la imagen RGB');
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
          _error = res['message'] as String? ??
              res['error'] as String? ??
              (ApiService.lang == 'en' ? 'Upload error' : 'Error al subir');
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
    final s = S.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.analyzePhoto),
        actions: const [LanguageToggle(compact: true)],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FilledButton.icon(
                onPressed: _loading ? null : _openCameraDirect,
                icon: const Icon(Icons.camera_alt, size: 28),
                label: Text(s.takePhoto),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  textStyle: const TextStyle(fontSize: 18),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _loading ? null : () => _pickImage(false),
                icon: const Icon(Icons.photo_library),
                label: Text(s.uploadGallery),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              const SizedBox(height: 24),
              Text(s.uploadHint, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 12),
              Card(
                color: Theme.of(context)
                    .colorScheme
                    .surfaceContainerHighest
                    .withValues(alpha: 0.5),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.lightbulb_outline,
                              size: 18,
                              color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 6),
                          Text(
                            s.betterDetection,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(s.tipsBody,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _buildImageCard(
                title: s.rgbRequired,
                file: _rgbFile,
                previewBytes: _rgbPreviewBytes,
                onTap: () => _pickImage(false),
                tapLabel: s.tapToSelect,
              ),
              const SizedBox(height: 16),
              _buildImageCard(
                title: s.thermalOptional,
                file: _thermalFile,
                previewBytes: _thermalPreviewBytes,
                onTap: () => _pickImage(true),
                tapLabel: s.tapToSelect,
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style:
                      TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: (_loading || _rgbFile == null) ? null : _upload,
                icon: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.cloud_upload),
                label: Text(_loading ? s.analyzing : s.analyzeThis),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                s.firstTimeDemo,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[700],
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _loading ? null : _runDemo,
                icon: const Icon(Icons.play_circle_outline),
                label: Text(s.viewDemoShort),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Theme.of(context).colorScheme.primary,
                ),
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
    required String tapLabel,
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
                    Text(title,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      file != null ? file.name : tapLabel,
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
