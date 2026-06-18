import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/network/api_client.dart';
import 'package:yolmates_app/core/network/auth_token_storage.dart';
import 'package:yolmates_app/features/auth/data/api_auth_repository.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';

class _CaptureAdapter implements HttpClientAdapter {
  Uint8List? body;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final chunks = await requestStream!.toList();
    body = Uint8List.fromList(chunks.expand((chunk) => chunk).toList());
    return ResponseBody.fromString(
      jsonEncode({
        'id': 'user-1',
        'phone': '+994501234567',
        'first_name': 'Test',
        'last_name': 'User',
        'role': 'passenger',
        'is_verified': false,
        'verification_status': 'pending',
        'document_url':
            '/api/v1/admin/verifications/user-1/document/verification_test.png',
      }),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('submitVerification sends selected file as multipart field file',
      () async {
    final directory =
        await Directory.systemTemp.createTemp('verification-test');
    addTearDown(() => directory.delete(recursive: true));
    final file = File('${directory.path}/license.png');
    final fileBytes = <int>[0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4];
    await file.writeAsBytes(fileBytes);

    final storage = InMemorySessionStorage();
    final client = ApiClient(AuthTokenStorage(storage));
    final adapter = _CaptureAdapter();
    client.dio.httpClientAdapter = adapter;
    final repository =
        ApiAuthRepository(client, AuthTokenStorage(storage), storage);

    final user = await repository.submitVerification(file.path);

    final multipart = latin1.decode(adapter.body!);
    expect(multipart, contains('name="file"'));
    expect(multipart, contains('filename="license.png"'));
    expect(multipart, contains('content-type: image/png'));
    expect(adapter.body!, containsAllInOrder(fileBytes));
    expect(user.verificationStatus, 'pending');
    expect(user.documentUrl, isNotEmpty);
  });
}
