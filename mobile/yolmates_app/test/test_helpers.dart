import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:yolmates_app/core/network/api_client.dart';
import 'package:yolmates_app/core/storage/secure_storage_service.dart';

Override inMemoryStorageOverride([
  SecureStorageService? storage,
]) {
  return secureStorageProvider.overrideWithValue(
    storage ?? SecureStorageService.memory(),
  );
}
