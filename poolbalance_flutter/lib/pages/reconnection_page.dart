import 'package:flutter/material.dart';

class ReconnectionPage extends StatelessWidget {
  const ReconnectionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Reconectando')),
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
