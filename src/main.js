import { Web } from "sip.js";

// --- Elementos del DOM ---
const servidorInput = document.getElementById('servidor');
const puertoInput = document.getElementById('puerto');
const extensionInput = document.getElementById('extension');
const claveInput = document.getElementById('clave');
const statusSpan = document.getElementById('status');
const numeroADialInput = document.getElementById('numeroADial');
const btnLlamar = document.getElementById('btnLlamar');
const btnColgar = document.getElementById('btnColgar');
const remoteAudio = document.getElementById('remoteAudio');

// --- Variables de la aplicación ---
let simpleUser; // Nuestra instancia de SimpleUser
let isCallActive = false;

// --- Función para inicializar el SimpleUser ---
const setupSimpleUser = () => {
    // Si ya existe una instancia, la detenemos
    if (simpleUser) {
        simpleUser.disconnect();
    }

    const servidor = servidorInput.value;
    const puerto = puertoInput.value;
    const extension = extensionInput.value;
    const clave = claveInput.value;

    if (!servidor || !puerto || !extension || !clave) {
        alert("Por favor, completa todos los campos de configuración.");
        return null;
    }

    // Dirección del servidor WebSocket
    const serverWSS = `wss://${servidor}:${puerto}`;
    
    // Tu dirección SIP (AOR - Address of Record)
    const aor = `sip:${extension}@${servidor}`;

    // Opciones para SimpleUser
    const options = {
        aor: aor,
        media: {
            remote: { audio: remoteAudio } // Asocia el audio remoto
        },
        userAgentOptions: {
            authorizationUsername: extension,
            password: clave,
            displayName: `Ext ${extension}`
        }
    };

    // Creamos la instancia
    const user = new Web.SimpleUser(serverWSS, options);

    // --- Manejo de Eventos ---
    user.delegate = {
        onCallCreated: () => {
            console.log("Llamada saliente iniciada...");
            statusSpan.textContent = "Llamando...";
            btnLlamar.disabled = true;
            btnColgar.disabled = false;
            isCallActive = true;
        },
        onCallAnswered: () => {
            console.log("Llamada contestada.");
            statusSpan.textContent = "En llamada";
        },
        onCallTerminated: () => {
            console.log("Llamada terminada.");
            statusSpan.textContent = "Desconectado";
            btnLlamar.disabled = false;
            btnColgar.disabled = true;
            isCallActive = false;
            
            // Desconectamos para liberar recursos si no estamos en una llamada
            if (simpleUser) {
                simpleUser.disconnect();
                simpleUser = null;
            }
        },
        onRegistered: () => {
            console.log("Extensión registrada.");
            statusSpan.textContent = "Registrado y listo";
        },
        onUnregistered: () => {
            console.log("Extensión no registrada.");
        },
        onServerConnect: () => {
            console.log("Conectado al servidor WebSocket.");
            statusSpan.textContent = "Conectado al servidor";
        },
        onServerDisconnect: (error) => {
            console.error("Desconectado del servidor WebSocket.", error);
            statusSpan.textContent = "Error de Conexión";
            btnLlamar.disabled = false;
            btnColgar.disabled = true;
            isCallActive = false;
            simpleUser = null; // Limpiamos la instancia
        }
    };

    return user;
};


// --- Lógica de los Botones ---

btnLlamar.addEventListener('click', async () => {
    const numeroADial = numeroADialInput.value;
    if (!numeroADial) {
        alert("Por favor, ingresa un número a llamar.");
        return;
    }
    
    // Si no tenemos un simpleUser o no está conectado, lo creamos y conectamos
    if (!simpleUser || !simpleUser.isConnected()) {
        simpleUser = setupSimpleUser();
        if (!simpleUser) return; // Si la configuración está incompleta

        try {
            await simpleUser.connect();
            await simpleUser.register();
        } catch (error) {
            console.error("Fallo al conectar o registrar:", error);
            statusSpan.textContent = "Error al conectar";
            return;
        }
    }
    
    // Hacemos la llamada
    const target = `sip:${numeroADial}@${servidorInput.value}`;
    try {
        await simpleUser.call(target);
    } catch (error) {
        console.error("Fallo al iniciar la llamada:", error);
    }
});

btnColgar.addEventListener('click', async () => {
    if (simpleUser && isCallActive) {
        try {
            await simpleUser.hangup();
        } catch (error) {
            console.error("Error al colgar:", error);
        }
    }
});


// Rellenamos los campos para probar (recuerda que esto debería venir de una config)
servidorInput.value = '45.179.164.4';
puertoInput.value = '8089'; // ¡El puerto correcto para WSS!
extensionInput.value = '9997';
claveInput.value = 'T3cn*45637954S';