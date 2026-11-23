package com.rbfs.services;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * High-performance streaming AES-256-CBC file encryption and decryption service.
 * Automatically prepends a cryptographically secure 16-byte random IV to every encrypted file.
 */
@Service
public class FileEncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(FileEncryptionService.class);
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_SIZE = 16;
    private static final int BUFFER_SIZE = 8192;

    @Value("${rbfs.encryptionKey}")
    private String encryptionKeyStr;

    private SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    @PostConstruct
    public void init() {
        try {
            // Derive a guaranteed 256-bit (32-byte) key using SHA-256
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(encryptionKeyStr.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(keyBytes, "AES");
            logger.info("AES-256 FileEncryptionService initialized successfully.");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to initialize AES key derivation", e);
        }
    }

    /**
     * Encrypts an input stream and writes [16-byte IV] + [AES-256 Ciphertext] to the output stream.
     */
    public void encryptStream(InputStream inputStream, OutputStream outputStream) throws IOException {
        try {
            // Generate random 16-byte IV
            byte[] iv = new byte[IV_SIZE];
            secureRandom.nextBytes(iv);

            // Write unencrypted IV to the beginning of the file stream
            outputStream.write(iv);

            // Initialize cipher in ENCRYPT mode
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new IvParameterSpec(iv));

            // Stream plaintext into CipherOutputStream
            try (CipherOutputStream cos = new CipherOutputStream(outputStream, cipher)) {
                byte[] buffer = new byte[BUFFER_SIZE];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    cos.write(buffer, 0, bytesRead);
                }
                cos.flush();
            }
        } catch (Exception e) {
            logger.error("Error during AES-256 stream encryption: {}", e.getMessage());
            throw new IOException("Encryption error: " + e.getMessage(), e);
        }
    }

    /**
     * Reads [16-byte IV] from the encrypted stream, decrypts ciphertext, and writes plaintext to the output stream.
     */
    public void decryptStream(InputStream encryptedInput, OutputStream plaintextOutput) throws IOException {
        try {
            // Read 16-byte IV
            byte[] iv = new byte[IV_SIZE];
            int bytesRead = encryptedInput.readNBytes(iv, 0, IV_SIZE);
            if (bytesRead < IV_SIZE) {
                throw new IOException("Invalid encrypted stream: IV is missing or corrupted");
            }

            // Initialize cipher in DECRYPT mode
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));

            try (CipherInputStream cis = new CipherInputStream(encryptedInput, cipher)) {
                byte[] buffer = new byte[BUFFER_SIZE];
                int read;
                while ((read = cis.read(buffer)) != -1) {
                    plaintextOutput.write(buffer, 0, read);
                }
                plaintextOutput.flush();
            }
        } catch (Exception e) {
            logger.error("Error during AES-256 stream decryption: {}", e.getMessage());
            throw new IOException("Decryption error: " + e.getMessage(), e);
        }
    }

    /**
     * Returns a CipherInputStream that transparently decrypts the ciphertext after extracting the prepended IV.
     */
    public InputStream getDecryptedInputStream(InputStream encryptedInput) throws IOException {
        try {
            byte[] iv = new byte[IV_SIZE];
            int bytesRead = encryptedInput.readNBytes(iv, 0, IV_SIZE);
            if (bytesRead < IV_SIZE) {
                throw new IOException("Invalid encrypted stream: IV is missing or corrupted");
            }

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));

            return new CipherInputStream(encryptedInput, cipher);
        } catch (Exception e) {
            logger.error("Error setting up decrypted stream: {}", e.getMessage());
            throw new IOException("Decryption stream setup error: " + e.getMessage(), e);
        }
    }
}
