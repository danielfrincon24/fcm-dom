// enviarPush.js
const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors()); // ✅ Para permitir peticiones desde frontend
app.use(bodyParser.json());

app.post("/enviar-notificacion", async (req, res) => {
  const { tokenFCM, opcion } = req.body;

  let message;
  switch (opcion) {
    case 1:
      message = {
        token: tokenFCM,
        notification: {
          title: "Inactividad",
          body: "Llevas mucho tiempo inactivo, no recibirás servicios",
        },
      };
      break;
    case 2:
      message = {
        token: tokenFCM,
        notification: {
          title: "Cancelado",
          body: "Servicio cancelado",
        },
      };
      break;
    case 3:
      message = {
        token: tokenFCM,
        notification: {
          title: "Servicio",
          body: "Servicio pendiente por confirmar",
        },
      };
      break;
    default:
      return res.status(400).json({ success: false, error: "Opción inválida" });
  }

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notificación enviada:", response);
    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error al enviar la notificación:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});


