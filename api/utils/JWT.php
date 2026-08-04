<?php
/**
 * Simple JWT Implementation
 * JSON Web Token encoding and decoding
 */

class JWT {
    
    /**
     * Encode payload to JWT
     */
    public static function encode($payload, $secret) {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $header_encoded = self::base64UrlEncode(json_encode($header));
        $payload_encoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('SHA256', "$header_encoded.$payload_encoded", $secret, true);
        $signature_encoded = self::base64UrlEncode($signature);

        return "$header_encoded.$payload_encoded.$signature_encoded";
    }

    /**
     * Decode JWT token
     */
    public static function decode($jwt, $secret) {
        $parts = explode('.', $jwt);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }

        list($header_encoded, $payload_encoded, $signature_encoded) = $parts;

        $signature = self::base64UrlDecode($signature_encoded);
        $expected_signature = hash_hmac('SHA256', "$header_encoded.$payload_encoded", $secret, true);

        if (!hash_equals($expected_signature, $signature)) {
            throw new Exception('Invalid signature');
        }

        $payload = json_decode(self::base64UrlDecode($payload_encoded));
        
        if (!$payload) {
            throw new Exception('Invalid payload');
        }

        return $payload;
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
