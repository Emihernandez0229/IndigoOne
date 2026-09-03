const { app, BrowserWindow } = require("electron")

// CREA LA VENTANA PRINCIPAL

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    minWidth: 1000,
    minHeight: 700,

    show: false,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // CARGA EL FRONTEND DE VITE

  mainWindow.loadURL("http://localhost:5173")

  // MUESTRA LA VENTANA CUANDO YA ESTÉ LISTA

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })
}

// INICIA ELECTRON

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// CIERRA LA APLICACIÓN

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})