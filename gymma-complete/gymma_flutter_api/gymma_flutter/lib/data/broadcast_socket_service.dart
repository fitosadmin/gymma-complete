import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_client.dart';

/// Real-time connection to broadcast-api's `/ws/broadcasts` namespace.
/// The server auto-joins the caller's gym rooms from the JWT, so there's
/// nothing to subscribe to beyond connecting — every 'broadcast' event
/// received here is already scoped to a gym this user belongs to.
class BroadcastSocketService {
  BroadcastSocketService._();
  static final BroadcastSocketService instance = BroadcastSocketService._();

  io.Socket? _socket;
  final _controller = StreamController<Map<String, dynamic>>.broadcast();

  /// Emits the raw payload of every 'broadcast' event the server sends
  /// while connected: {broadcast_id, gym_id, title, message, type,
  /// priority, sender_id, sent_at}.
  Stream<Map<String, dynamic>> get onBroadcast => _controller.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Safe to call repeatedly — no-ops if already connected with the same
  /// token. Requires [ApiClient.authToken] to be set first.
  void connect() {
    final token = ApiClient.authToken;
    if (token == null) return;
    if (_socket != null) return;

    // The /ws/broadcasts namespace is part of the connection URI itself
    // (same convention as the JS client) — the origin alone would connect
    // to socket.io's default "/" namespace instead.
    final socket = io.io(
      '$kBroadcastSocketOrigin/ws/broadcasts',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableReconnection()
          .build(),
    );

    socket.onConnect((_) => debugPrint('broadcast ws connected'));
    socket.onConnectError((err) => debugPrint('broadcast ws connect error: $err'));
    socket.onDisconnect((_) => debugPrint('broadcast ws disconnected'));
    socket.on('broadcast', (data) {
      if (data is Map) {
        _controller.add(Map<String, dynamic>.from(data));
      }
    });

    socket.connect();
    _socket = socket;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}
