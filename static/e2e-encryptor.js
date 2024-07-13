
const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
const salt = crypto.getRandomValues(new Uint8Array(16));

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

async function encryptDataWithUserKey(data, derivedKey) {
    const encodedData = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        derivedKey,
        encodedData
    );

    return {
        iv: iv,
        encryptedData: new Uint8Array(encrypted),
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

async function encryptAndSend() {
    const plaintext = document.getElementById('plaintext').value;
    const password = document.getElementById('password').value;

    try {
        const derivedKey = await deriveKeyFromPassword(password);
        const { iv, encryptedData } = await encryptDataWithUserKey(plaintext, derivedKey.key);

        const decrypted = await decryptDataWithUserKey(encryptedData, iv, derivedKey.key);


        console.log("iv: "+iv)
        console.log("salt: "+salt)

        sendFetch(encryptedData)

        console.log(decrypted)


        console.log('Encryption and sending successful.');
    } catch (error) {
        console.error('Error during encryption or sending:', error);
    }
}


function sendFetch(content) {
    fetch('/add_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add any other headers as needed
        },
        body: JSON.stringify({
            content: btoa(content), // encrypt array with base64 so sql can understand
            iv: btoa(iv),
            salt: btoa(salt)
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse JSON response
        })
        .then(data => {
            var resl = document.getElementById("resl")
            resl.textContent = `${window.location.origin}/notes/${data.uuid}`
            console.log('Success:', data);
        })
        .catch(error => {
            alert("Something went wrong, try again later.")
            console.error('Error:', error);
        });

}