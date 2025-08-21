import 'package:device_info_plus/device_info_plus.dart';
import 'package:uuid/uuid.dart';

class DeviceService {
  static final Uuid _uuid = Uuid();

  static Future<String> getDeviceId() async {
    final deviceInfo = DeviceInfoPlugin();
    try {
      if (deviceInfo.isPhysicalDevice != null) {
        final androidInfo = await deviceInfo.androidInfo;
        return androidInfo.androidId ?? _uuid.v4();
      } else {
        final iosInfo = await deviceInfo.iosInfo;
        return iosInfo.identifierForVendor ?? _uuid.v4();
      }
    } catch (e) {
      return _uuid.v4();
    }
  }
}
