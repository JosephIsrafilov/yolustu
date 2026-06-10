import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/routes.dart';
import 'core/theme.dart';

void main() {
  runApp(const YolmatesApp());
}

class YolmatesApp extends StatelessWidget {
  const YolmatesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Yolmates',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
