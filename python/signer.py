"""
DID Signing for A2G Protocol

HMAC-SHA256 signing for agent identity authentication.
"""

import hashlib
import hmac
import secrets
import time
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Signature:
    """HMAC-SHA256 signature with replay protection"""
    timestamp: str
    nonce: str
    hash: str
    
    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "nonce": self.nonce,
            "hash": self.hash,
        }


class Signer:
    """
    HMAC-SHA256 Signer for AEON DID authentication.
    
    Example:
        >>> key = Signer.generate_key()
        >>> sig = Signer.sign(key, "my message")
        >>> Signer.verify(key, sig, "my message")
        True
    """
    
    @staticmethod
    def sign(
        signing_key: str,
        message: str | dict,
        timestamp: Optional[str] = None,
        nonce: Optional[str] = None,
    ) -> Signature:
        """
        Sign a message using HMAC-SHA256.
        
        Args:
            signing_key: The secret key (hex-encoded, 256-bit)
            message: The message to sign (string or dict)
            timestamp: Optional custom timestamp (ms since epoch)
            nonce: Optional custom nonce (UUIDv4)
            
        Returns:
            Signature with timestamp, nonce, and hash
        """
        import json
        
        ts = timestamp or str(int(time.time() * 1000))
        nc = nonce or str(uuid.uuid4())
        
        # Normalize message to string
        if isinstance(message, dict):
            msg_str = json.dumps(message, sort_keys=True, separators=(',', ':'))
        else:
            msg_str = str(message)
        
        # Create payload: timestamp:nonce:message
        payload = f"{ts}:{nc}:{msg_str}"
        
        # Generate HMAC-SHA256
        key_bytes = signing_key.encode('utf-8')
        sig_hash = hmac.new(key_bytes, payload.encode('utf-8'), hashlib.sha256).hexdigest()
        
        return Signature(timestamp=ts, nonce=nc, hash=sig_hash)
    
    @staticmethod
    def verify(
        signing_key: str,
        signature: Signature,
        message: str | dict,
        max_age_ms: int = 5 * 60 * 1000,  # 5 minutes
    ) -> bool:
        """
        Verify a signature.
        
        Args:
            signing_key: The secret key used for signing
            signature: The signature to verify
            message: The original message
            max_age_ms: Maximum age in milliseconds (default: 5 minutes)
            
        Returns:
            True if signature is valid and not expired
        """
        # Check timestamp age
        try:
            signed_at = int(signature.timestamp)
            now = int(time.time() * 1000)
            if now - signed_at > max_age_ms:
                return False  # Signature expired
        except ValueError:
            return False
        
        # Recompute the hash
        expected = Signer.sign(
            signing_key, 
            message, 
            timestamp=signature.timestamp,
            nonce=signature.nonce,
        )
        
        # Constant-time comparison
        return hmac.compare_digest(signature.hash, expected.hash)
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new random signing key.
        
        Returns:
            Hex-encoded 256-bit key (64 characters)
        """
        return secrets.token_hex(32)
    
    @staticmethod
    def hash(signing_key: str, message: str | dict) -> str:
        """
        Hash a message without timestamp/nonce.
        
        Useful for deterministic hashes.
        
        Args:
            signing_key: The secret key
            message: The message to hash
            
        Returns:
            Hex-encoded HMAC-SHA256 hash
        """
        import json
        
        if isinstance(message, dict):
            msg_str = json.dumps(message, sort_keys=True, separators=(',', ':'))
        else:
            msg_str = str(message)
        
        key_bytes = signing_key.encode('utf-8')
        return hmac.new(key_bytes, msg_str.encode('utf-8'), hashlib.sha256).hexdigest()
