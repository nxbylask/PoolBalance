import 'package:flutter_dotenv/flutter_dotenv.dart';

final String API_URL = dotenv.env['API_URL'] ?? '';
final String FRONTEND_URL = dotenv.env['FRONTEND_URL'] ?? '';
final int API_TIMEOUT = int.tryParse(dotenv.env['API_TIMEOUT'] ?? '60') ?? 60;
