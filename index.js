// enviarPush.js
const express   = require("express");
const admin     = require("firebase-admin");
const bodyParser = require("body-parser");
const cors      = require("cors");

const serviceAccount = {
  type:                        process.env.FIREBASE_TYPE,
  project_id:                  process.env.FIREBASE_PROJECT_ID,
  private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key:                 process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email:                process.env.FIREBASE_CLIENT_EMAIL,
  client_id:                   process.env.FIREBASE_CLIENT_ID,
  auth_uri:                    process.env.FIREBASE_AUTH_URI,
  token_uri:                   process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url:        process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain:             process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ID del canal de notificación — debe coincidir exactamente con
// CHANNEL_ID en LocationUpdateForegroundService.kt y MyFirebaseMessagingService.kt
const CHANNEL_ID = "LocationUpdateForegroundServiceChannel";

app.get("/", (req, res) => {
  res.json({
    message: "API de Notificaciones FCM operativa",
    endpoints: {
      enviar_notificacion: {
        method: "POST",
        url: "/enviar-notificacion",
        body_format: {
          tokenFCM: "string (token del dispositivo)",
          opcion:   "1, 2 o 3"
        }
      }
    }
  });
});

app.post("/enviar-notificacion", async (req, res) => {
  const { tokenFCM, opcion } = req.body;

  let titulo;
  let cuerpo;

  switch (opcion) {
    case 1:
      titulo = "Inactividad";
      cuerpo = "Llevas mucho tiempo inactivo, no recibirás servicios";
      break;
    case 2:
      titulo = "Cancelado";
      cuerpo  = "Servicio cancelado";
      break;
    case 3:
      titulo = "Servicio";
      cuerpo  = "Servicio pendiente por confirmar";
      break;
    default:
      return res.status(400).json({ success: false, error: "Opción inválida" });
  }

  const message = {
    token: tokenFCM,

    // Solo "data" — sin ningún bloque "notification" en ningún nivel.
    // Esto garantiza que Firebase SIEMPRE entregue el mensaje a
    // onMessageReceived(), tanto en foreground como en background.
    // La app construye y muestra la notificación visualmente.
    data: {
      title:  titulo,
      body:   cuerpo,
      opcion: String(opcion)
    },

    android: {
      priority: "high",        // entrega inmediata aunque el dispositivo esté en Doze
      ttl:      86400 * 1000,  // tiempo de vida: 24 horas en milisegundos
      // SIN android.notification — si existe, Firebase lo convierte
      // en notification message y el sistema lo maneja sin pasar por la app
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ Notificación enviada [opcion=${opcion}]:`, response);
    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error al enviar la notificación:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
