// Smoke test: la app arranca y muestra la pantalla principal (Home).
import 'package:flutter_test/flutter_test.dart';
import 'package:cattleguard_app/main.dart';
import 'package:cattleguard_app/screens/home_screen.dart';

void main() {
  testWidgets('App arranca y muestra pantalla principal', (WidgetTester tester) async {
    await tester.pumpWidget(const CattleGuardApp());
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);
  });
}
