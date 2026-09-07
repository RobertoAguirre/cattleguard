import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LocaleController extends ChangeNotifier {
  Locale _locale = const Locale('en');

  Locale get locale => _locale;
  bool get isEnglish => _locale.languageCode == 'en';
  String get langCode => _locale.languageCode;

  void setLocale(Locale locale) {
    if (_locale == locale) return;
    _locale = locale;
    ApiService.setLang(locale.languageCode);
    notifyListeners();
  }

  void toggle() {
    setLocale(isEnglish ? const Locale('es') : const Locale('en'));
  }
}
