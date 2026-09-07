import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'l10n/locale_controller.dart';
import 'screens/landing_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CattleGuardApp());
}

class CattleGuardApp extends StatelessWidget {
  const CattleGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LocaleController(),
      child: Consumer<LocaleController>(
        builder: (context, localeCtrl, _) {
          return MaterialApp(
            title: 'CattleGuard',
            debugShowCheckedModeBanner: false,
            locale: localeCtrl.locale,
            supportedLocales: const [
              Locale('en'),
              Locale('es'),
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
              useMaterial3: true,
            ),
            home: const LandingScreen(),
          );
        },
      ),
    );
  }
}
