// --- Elementos del DOM ---
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
let inviter;

// --- Lógica de Configuración desde Variables de Entorno ---
document.addEventListener('DOMContentLoaded', () => {
    // window.env es creado por config.js en el servidor
    if (window.env && window.env.SERVIDOR && window.env.PUERTO_WSS) {
        console.log("Configuración encontrada en variables de entorno.");
        servidorInput.value = window.env.SERVIDOR;
        puertoInput.value = window.env.PUERTO_WSS;
        
        if (window.env.EXTENSION) {
            extensionInput.value = window.env.EXTENSION;
        }
        if (window.env.CLAVE) {
            claveInput.value = window.env.CLAVE;
        }
    } else {
        console.log("No se encontraron variables de entorno. Usando configuración manual.");
    }
});

// --- Lógica de Conexión ---
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
    
    const uri = `sip:${extension}@${servidor}`;
    const transportOptions = {
        server: `wss://${servidor}:${puerto}`
    };

    userAgent = new SIP.UserAgent({
        uri: SIP.URI.parse(uri),
        transportOptions,
        password: clave,
        authorizationUser: extension,
    });

    userAgent.delegate = {
        onConnect: () => {
            console.log("¡Conectado a Issabel!");
            statusSpan.textContent = "Conectado";
            statusSpan.style.color = "green";
            btnConectar.textContent = "Desconectar";
            btnLlamar.disabled = false;
        },
        onDisconnect: (error) => {
            console.log("Desconectado.");
            statusSpan.textContent = "Desconectado";
            statusSpan.style.color = "red";
            btnConectar.textContent = "Conectar";
            btnLlamar.disabled = true;
            btnColgar.disabled = true;
            if (error) {
                console.error("Desconexión por error:", error);
            }
        },
        onInvite: (invitation) => {
            console.log("Llamada entrante recibida", invitation);
            invitation.reject(); 
        }
    };

    userAgent.start().catch(error => {
        console.error("Fallo al iniciar el User Agent:", error);
        statusSpan.textContent = "Error de Conexión";
        statusSpan.style.color = "red";
    });
});

// --- Lógica de Llamada ---
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
    const targetUri = SIP.URI.parse(`sip:${target}@${servidorInput.value}`);
    const inviterOptions = {
        sessionDescriptionHandlerOptions: {
            constraints: { audio: true, video: false }
        }
    };
    inviter = new SIP.Inviter(userAgent, targetUri, inviterOptions);
    inviter.sessionDescriptionHandler.on("addTrack", (track) => {
        const stream = new MediaStream();
        stream.addTrack(track);
        remoteAudio.srcObject = stream;
        remoteAudio.play();
    });
    inviter.stateChange.addListener(newState => {
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
    inviter.invite().catch(error => console.error("Fallo al llamar:", error));
});

// --- Lógica para Colgar ---
btnColgar.addEventListener('click', () => {
    if (inviter) {
        inviter.bye();
    }
});