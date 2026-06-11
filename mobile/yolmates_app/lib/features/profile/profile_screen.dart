import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                    child: const Text(
                      'RS',
                      style: TextStyle(
                        color: AppTheme.tealDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 32,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Rashad Suleymanov',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.star, size: 18, color: Colors.amber),
                      SizedBox(width: 4),
                      Text('4.9 · 156 səyahət'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Menu items
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.account_balance_wallet),
                  title: const Text('Pul kisəsi'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Navigate to wallet
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.message),
                  title: const Text('Mesajlar'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/chat'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.inbox),
                  title: const Text('Rezervasiyalarım'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/bookings'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.directions_car),
                  title: const Text('Sürücü rejimi'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Navigate to driver mode
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.settings),
                  title: const Text('Parametrlər'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.help),
                  title: const Text('Kömək'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: const Text(
                    'Çıxış',
                    style: TextStyle(color: Colors.red),
                  ),
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
