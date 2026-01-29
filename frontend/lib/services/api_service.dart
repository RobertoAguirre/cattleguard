import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config.dart';

class ApiService {
  static String get baseUrl => '$apiBaseUrl$apiPrefix';

  static String? _token;

  static void setToken(String? token) {
    _token = token;
  }

  static Map<String, String> get _headers => {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  /// POST /api/auth/register
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    String? role,
  }) async {
    final r = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
        if (role != null) 'role': role,
      }),
    );
    return _parseJson(r);
  }

  /// POST /api/auth/login
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final r = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _parseJson(r);
  }

  /// GET /api/auth/me
  static Future<Map<String, dynamic>> me() async {
    final r = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: _headers,
    );
    return _parseJson(r);
  }

  /// POST /api/scans (multipart: thermal, rgb)
  static Future<Map<String, dynamic>> uploadScan({
    required List<int> rgbBytes,
    List<int>? thermalBytes,
    String? source,
    String? scanType,
  }) async {
    final uri = Uri.parse('$baseUrl/scans');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $_token';
    request.headers['Accept'] = 'application/json';

    final imageJpeg = MediaType('image', 'jpeg');
    request.files.add(http.MultipartFile.fromBytes(
      'rgb',
      rgbBytes,
      filename: 'rgb.jpg',
      contentType: imageJpeg,
    ));
    if (thermalBytes != null && thermalBytes.isNotEmpty) {
      request.files.add(http.MultipartFile.fromBytes(
        'thermal',
        thermalBytes,
        filename: 'thermal.jpg',
        contentType: imageJpeg,
      ));
    } else {
      request.files.add(http.MultipartFile.fromBytes(
        'thermal',
        rgbBytes,
        filename: 'thermal.jpg',
        contentType: imageJpeg,
      ));
    }
    if (source != null) request.fields['source'] = source;
    if (scanType != null) request.fields['scanType'] = scanType;

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _parseJson(response);
  }

  /// GET /api/scans
  static Future<Map<String, dynamic>> getScans() async {
    final r = await http.get(
      Uri.parse('$baseUrl/scans'),
      headers: _headers,
    );
    return _parseJson(r);
  }

  /// GET /api/scans/:id
  static Future<Map<String, dynamic>> getScan(String id) async {
    final r = await http.get(
      Uri.parse('$baseUrl/scans/$id'),
      headers: _headers,
    );
    return _parseJson(r);
  }

  static Map<String, dynamic> _parseJson(http.Response r) {
    final body = r.body;
    if (body.isEmpty) return {'_status': r.statusCode};
    try {
      final map = jsonDecode(body) as Map<String, dynamic>;
      map['_status'] = r.statusCode;
      return map;
    } catch (_) {
      return {'_status': r.statusCode, 'message': body};
    }
  }
}
