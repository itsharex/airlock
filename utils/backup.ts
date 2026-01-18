// Utility for secure backup encryption/decryption using PBKDF2 + AES-GCM

export async function exportData(data: object, password: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const key = await deriveKey(password, salt)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const encodedData = new TextEncoder().encode(JSON.stringify(data))

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
    )

    // Format: BASE64_SALT:BASE64_IV:BASE64_DATA
    const saltStr = btoa(String.fromCharCode(...salt))
    const ivStr = btoa(String.fromCharCode(...iv))
    const dataStr = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)))

    return JSON.stringify({
        salt: saltStr,
        iv: ivStr,
        data: dataStr,
        version: 1
    })
}

export async function importData(jsonStr: string, password: string): Promise<any> {
    try {
        const payload = JSON.parse(jsonStr)
        if (!payload.salt || !payload.iv || !payload.data) {
            throw new Error("Invalid backup file format")
        }

        const salt = Uint8Array.from(atob(payload.salt), c => c.charCodeAt(0))
        const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0))
        const data = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0))

        const key = await deriveKey(password, salt)

        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        )

        const decodedStr = new TextDecoder().decode(decryptedContent)
        return JSON.parse(decodedStr)
    } catch (e) {
        console.error("Backup restore failed", e)
        throw new Error("Failed to decrypt backup. Incorrect password or corrupted file.")
    }
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    )

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    )
}
