# homebridge-solarman

[![npm version](https://img.shields.io/npm/v/homebridge-solarman)](https://www.npmjs.com/package/homebridge-solarman)
[![license](https://img.shields.io/npm/l/homebridge-solarman)](LICENSE)

Plugin de [Homebridge](https://homebridge.io) para monitorizar inversores solares SOLARMAN en Apple HomeKit.

## Funcionalidades

Muestra 4 sensores como tiles grandes en la app Casa de Apple:

| Sensor | Dato | Unidad |
|--------|------|--------|
| ☀️ **Generación Solar** | Potencia generada por los paneles | kW |
| 🏠 **Consumo Casa** | Potencia consumida en el hogar | kW |
| 🔋 **Batería** | Estado de carga de la batería | % |
| ⚡ **Excedente** | Energía sobrante (generación - consumo) | kW |

Cada sensor aparece como un **Thermostat read-only** en HomeKit, mostrando el valor como número grande y visible en la pantalla principal de la app Casa.

## Instalación

### Vía Homebridge UI

Busca `homebridge-solarman` en la pestaña de Plugins de Homebridge UI.

### Vía Terminal

```bash
npm install -g homebridge-solarman
```

## Configuración

### Vía Homebridge UI (recomendado)

El plugin incluye un formulario de configuración integrado en Homebridge UI. Solo necesitas rellenar email y contraseña de tu cuenta SOLARMAN.

### Vía config.json

```json
{
  "platforms": [
    {
      "platform": "SolarmanMonitor",
      "name": "Solarman",
      "email": "tu-email@ejemplo.com",
      "password": "tu-contraseña",
      "pollingInterval": 60
    }
  ]
}
```

### Parámetros

| Parámetro | Requerido | Defecto | Descripción |
|-----------|-----------|---------|-------------|
| `email` | ✅ Sí | - | Email de tu cuenta SOLARMAN |
| `password` | ✅ Sí | - | Contraseña de tu cuenta SOLARMAN |
| `plantId` | No | Auto | ID de la planta (se detecta automáticamente) |
| `pollingInterval` | No | 60 | Intervalo de actualización en segundos (mín: 30) |
| `token` | No | - | Token API pre-configurado (ver sección abajo) |

### Usar token pre-configurado

Si el login OAuth devuelve datos vacíos (común en algunas regiones), puedes usar un token API directamente:

1. Inicia sesión en [globalpro.solarmanpv.com](https://globalpro.solarmanpv.com)
2. Abre DevTools del navegador (F12) > Network
3. Busca cualquier petición a la API y copia el valor del header `Authorization: Bearer ...`
4. Pega el token en el campo `token` de la configuración

```json
{
  "platform": "SolarmanMonitor",
  "name": "Solarman",
  "email": "tu-email@ejemplo.com",
  "password": "tu-contraseña",
  "token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

## Cómo funciona

1. El plugin se conecta a la API de SOLARMAN (`globalpro.solarmanpv.com`)
2. Detecta automáticamente tu planta solar (o usa el `plantId` configurado)
3. Consulta los datos en tiempo real cada `pollingInterval` segundos
4. Actualiza los 4 sensores en HomeKit con los valores actuales

## Compatibilidad

- **Homebridge** >= 1.8.0
- **Node.js** >= 18.0.0
- **Inversores SOLARMAN** compatibles con globalpro.solarmanpv.com
- Probado con inversores híbridos con batería

## Comandos Siri

Los sensores aparecen como termostatos, así que puedes preguntar:

- *"Oye Siri, ¿cuál es la temperatura de Generación Solar?"* → Te dirá los kW actuales
- *"Oye Siri, ¿cuál es la temperatura de Batería?"* → Te dirá el % de carga

## Solución de problemas

### Login failed
- Verifica email y contraseña en [globalpro.solarmanpv.com](https://globalpro.solarmanpv.com)
- Si falla, prueba con un token pre-configurado

### No plants found
- Asegúrate de que tu cuenta tiene al menos una planta registrada
- Prueba especificando el `plantId` manualmente

### Valores en 0
- Durante la noche, la generación solar será 0 (normal)
- Si todos los valores son 0 durante el día, verifica la conexión del inversor

## Licencia

MIT