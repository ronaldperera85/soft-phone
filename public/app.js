// --- Elementos del DOM (sin cambios) ---
const servidorInput = document.getElementById('servidor');
const puertoInput = document.getElementById('puerto');
const extensionInput = document.getElementById('extension');
const claveInput = document.getElementById('clave');
const btnConectar = document.getElementById('btnConectar');
const statusSpan = document.getElementById('status');
const numeroADialInput = document.getElementById('numeroADial');
const btnLlamar = document.getElementById('btnLlamar');
const btnColgar = document.getElementById('btnColgar');
const remoteAudio = document.getElementById('remoteAudio');

// --- Variables de la aplicación ---
let userAgent;
let inviter; // Objeto para la llamada saliente

// --- Lógica de Configuración desde Variables de Entorno (sin cambios) ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.env && window.env.SERVIDOR && window.env.PUERTO_WSS) {
        console.log("Configuración encontrada en variables de entorno.");
        servidorInput.value = window.env.SERVIDOR;
        puertoInput.value = window.env.PUERTO_WSS;
        if (window.env.EXTENSION) extensionInput.value = window.env.EXTENSION;
        if (window.env.CLAVE) claveInput.value = window.env.CLAVE;
    } else {
        console.log("No se encontraron variables de entorno. Usando configuración manual.");
    }
});

// --- Lógica de Conexión (ACTUALIZADA A LA NUEVA API) ---
btnConectar.addEventListener('click', () => {
    if (userAgent && userAgent.isConnected()) {
        console.log("Ya está conectado. Desconectando...");
        userAgent.stop();
        return;
    }

    const servidor = servidorInput.value;
    const puerto = puertoInput.value;
    const extension = extensionInput.value;
    const clave = claveInput.value;

    if (!servidor || !puerto || !extension || !clave) {
        alert("Por favor, completa todos los campos de configuración.");
        return;
    }

    const uri = SIP.UserAgent.makeURI(`sip:${extension}@${servidor}`);
    if (!uri) {
        alert("Error: URI de SIP inválida.");
        return;
    }

    // Nombres de objetos cambiaron. 'SIP' es ahora el objeto global.
    userAgent = new SIP.UserAgent({
        uri: uri,
        transportOptions: {
            server: `wss://${servidor}:${puerto}`
        },
        password: clave,
        authorizationUsername: extension, // El nombre del parámetro cambió
    });

    userAgent.stateChange.addListener((newState) => {
        switch (newState) {
            case SIP.UserAgentState.Started:
                console.log("¡Conectado a Issabel!");
                statusSpan.textContent = "Conectado";
                statusSpan.style.color = "green";
                btnConectar.textContent = "Desconectar";
                btnLlamar.disabled = false;
                break;
            case SIP.UserAgentState.Stopped:
                console.log("Desconectado.");
                statusSpan.textContent = "Desconectado";
                statusSpan.style.color = "red";
                btnConectar.textContent = "Conectar";
                btnLlamar.disabled = true;
                btnColgar.disabled = true;
                userAgent = null;
                break;
        }
    });

    userAgent.start().catch(error => {
        console.error("Fallo al iniciar el User Agent:", error);
        statusSpan.textContent = "Error de Conexión";
        statusSpan.style.color = "red";
    });
});

// --- Lógica de Llamada (ACTUALIZADA A LA NUEVA API) ---
btnLlamar.addEventListener('click', () => {
    const target = numeroADialInput.value;
    if (!target) {
        alert("Ingresa un número para llamar.");
        return;
    }

    if (!userAgent || !userAgent.isConnected()) {
        alert("No estás conectado. Conéctate primero.");
        return;
    }

    const targetUri = SIP.UserAgent.makeURI(`sip:${target}@${servidorInput.value}`);
    if (!targetUri) {
        alert("Número de destino inválido.");
        return;
    }

    // La nueva forma de hacer una llamada es creando un "Inviter"
    inviter = new SIP.Inviter(userAgent, targetUri, {
        sessionDescriptionHandlerOptions: {
            constraints: { audio: true, video: false }
        }
    });

    // Manejar el audio de la llamada (nueva forma)
    inviter.sessionDescriptionHandler.remoteMediaStream.onaddtrack = () => {
        console.log("Pista de audio recibida.");
        remoteAudio.srcObject = inviter.sessionDescriptionHandler.remoteMediaStream;
        remoteAudio.play();
    };
    
    // Eventos del estado de la llamada (nueva forma)
    inviter.stateChange.addListener(newState => {
        // Se usan los nuevos enums como SessionState.Established
        switch (newState) {
            case SIP.SessionState.Established:
                console.log("¡Llamada establecida!");
                btnLlamar.disabled = true;
                btnColgar.disabled = false;
                break;
            case SIP.SessionState.Terminated:
                console.log("Llamada terminada.");
                btnLlamar.disabled = false;
                btnColgar.disabled = true;
                inviter = null;
                remoteAudio.srcObject = null;
                break;
        }
    });

    inviter.invite().catch(error => {
        console.error("Fallo al llamar:", error);
    });
});

// --- Lógica para Colgar (ACTUALIZADA A LA NUEVA API) ---
btnColgar.addEventListener('click', () => {
    if (inviter) {
        console.log("Colgando la llamada...");
        // Para colgar, ahora se llama al método bye() del Inviter
        inviter.bye();
    }
});