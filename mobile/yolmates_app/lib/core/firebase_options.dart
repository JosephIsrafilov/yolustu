import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Minimal Firebase options driven by dart-defines.
///
/// ponytail: generated FlutterFire config would be nicer, but env-backed options
/// keep repo secrets out and let the app compile before project-specific setup.
class DefaultFirebaseOptions {
  DefaultFirebaseOptions._();

  static const _apiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const _appIdAndroid = String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
  static const _appIdIos = String.fromEnvironment('FIREBASE_IOS_APP_ID');
  static const _messagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
  );
  static const _projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const _storageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET');
  static const _iosBundleId = String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID');

  static FirebaseOptions? get currentPlatform {
    if (_apiKey.isEmpty ||
        _messagingSenderId.isEmpty ||
        _projectId.isEmpty ||
        (defaultTargetPlatform == TargetPlatform.android && _appIdAndroid.isEmpty) ||
        (defaultTargetPlatform == TargetPlatform.iOS && _appIdIos.isEmpty)) {
      return null;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return FirebaseOptions(
          apiKey: _apiKey,
          appId: _appIdAndroid,
          messagingSenderId: _messagingSenderId,
          projectId: _projectId,
          storageBucket: _storageBucket.isEmpty ? null : _storageBucket,
        );
      case TargetPlatform.iOS:
        return FirebaseOptions(
          apiKey: _apiKey,
          appId: _appIdIos,
          messagingSenderId: _messagingSenderId,
          projectId: _projectId,
          storageBucket: _storageBucket.isEmpty ? null : _storageBucket,
          iosBundleId: _iosBundleId.isEmpty ? null : _iosBundleId,
        );
      default:
        return null;
    }
  }
}
