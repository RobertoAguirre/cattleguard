import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/locale_controller.dart';

class LanguageToggle extends StatelessWidget {
  const LanguageToggle({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleController>();
    final isEn = locale.isEnglish;

    if (compact) {
      return TextButton(
        onPressed: locale.toggle,
        style: TextButton.styleFrom(
          minimumSize: const Size(48, 36),
          padding: const EdgeInsets.symmetric(horizontal: 8),
        ),
        child: Text(
          isEn ? 'ES' : 'EN',
          style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.5),
        ),
      );
    }

    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(value: 'es', label: Text('ES')),
        ButtonSegment(value: 'en', label: Text('EN')),
      ],
      selected: {isEn ? 'en' : 'es'},
      onSelectionChanged: (set) {
        final code = set.first;
        locale.setLocale(Locale(code));
      },
      style: const ButtonStyle(
        visualDensity: VisualDensity.compact,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
