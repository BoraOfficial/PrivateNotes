        async function deriveKeyFromPassword(password) {
            const encoder = new TextEncoder();
            const encodedPassword = encoder.encode(password);
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encodedPassword,
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            const salt_string = atob(document.getElementById("salt").value)

            const saltArray = salt_string.split(',').map(Number);

            // Create a Uint8Array from the array of numbers
            const salt = new Uint8Array(saltArray);

            console.log("salt: "+salt)

            const iterations = 100000;
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: iterations,
                    hash: { name: 'SHA-256' },
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            return {
                key: key,
                salt: salt,
                iterations: iterations,
            };
        }


        async function decryptDataWithUserKey(encryptedData, iv, derivedKey) {
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                derivedKey,
                encryptedData
            );

            return new TextDecoder().decode(decrypted);
        }





function base64ToUint8Array(input) {
    const input_string = atob(input)

    const inputArray = input_string.split(',').map(Number);

    // Create a Uint8Array from the array of numbers
    return new Uint8Array(inputArray);
}

async function decryptAndView() {
    try {
        const encryptedDataBase64 = document.getElementById('encrypted').value;
        const encryptedData = base64ToUint8Array(encryptedDataBase64); // Convert base64 string to ArrayBuffer

        const password = document.getElementById('password').value;

        const ivBase64 = document.getElementById("iv").value;
        const iv = base64ToUint8Array(ivBase64);


        console.log("iv: "+iv)

        const derivedKey = await deriveKeyFromPassword(password);
        
        const decrypted = await decryptDataWithUserKey(encryptedData, iv, derivedKey.key);
        
        document.getElementById('result').value = decrypted;
        document.getElementById('result').disabled = false;

    } catch (error) {
        alert("Incorrect password!")
    }
}

