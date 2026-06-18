import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ponytail: app is light-only; provider kept so existing watch() calls compile
final themeModeProvider = Provider<ThemeMode>((_) => ThemeMode.light);
