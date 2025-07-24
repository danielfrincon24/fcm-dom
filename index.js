// enviarPush.js
const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

const serviceAccount = require("./domicilios-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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


