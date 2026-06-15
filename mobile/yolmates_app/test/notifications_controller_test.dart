import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:yolmates_app/features/notifications/data/notifications_controller.dart';

void main() {
  test('addNotification prepends new items and de-duplicates by id', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final controller = container.read(notificationsProvider.notifier);
    final originalLength = container.read(notificationsProvider).length;

    controller.addNotification(
      id: 'push-1',
      title: 'Booking accepted',
      body: 'Driver accepted your booking.',
    );
    controller.addNotification(
      id: 'push-1',
      title: 'Booking accepted',
      body: 'Driver accepted your booking.',
    );

    final items = container.read(notificationsProvider);
    expect(items.first.id, 'push-1');
    expect(items.where((item) => item.id == 'push-1').length, 1);
    expect(items.length, originalLength + 1);
  });
}
