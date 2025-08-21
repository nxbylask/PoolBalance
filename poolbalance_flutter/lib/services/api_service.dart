import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';
import 'device_service.dart';

class ApiService {
  static Future<dynamic> getPools() async {
    try {
      final deviceId = await DeviceService.getDeviceId();
      final response = await http
          .get(Uri.parse('$API_URL/api/pools'), headers: {'X-Device-ID': deviceId})
          .timeout(Duration(seconds: API_TIMEOUT));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Error en la API: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('No se pudo conectar al backend: $e');
    }
  }
}
