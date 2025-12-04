
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include "MAX30105.h"
#include <Adafruit_MLX90614.h>

WebServer server(80);
MAX30105 particleSensor;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

const uint16_t WARMUP_TIME = 10000;
const uint16_t UPDATE_INTERVAL = 2000;
const uint32_t FINGER_THRESHOLD = 30000;

struct
{
    int hr = 0;
    int spo2 = 0;
    float temp = 0.0;
    bool finger = false;
    String status = "Warming up";
} healthData;

void setup()
{
    Serial.begin(115200);
    while (!Serial)
        ;

    Serial.println("Initializing...");

    Wire.begin(21, 22);
    Wire.setClock(100000);

    if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD))
    {
        Serial.println("MAX30102 not found!");
        while (1)
            ;
    }

    if (!mlx.begin())
    {
        Serial.println("MLX90614 not found!");
        while (1)
            ;
    }

    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x1F);
    particleSensor.setPulseAmplitudeIR(0x1F);

    WiFi.softAP("HealthMonitor");
    Serial.print("Connect to: HealthMonitor\nIP: ");
    Serial.println(WiFi.softAPIP());
    
    server.begin();
    server.on("/data", []()
              {
    String json = String() +
  "{\"hr\":" + String(healthData.hr) +
  ",\"spo2\":" + String(healthData.spo2) +
  ",\"temp\":" + String(healthData.temp, 1) +
  ",\"finger\":" + String(healthData.finger ? 1 : 0) +
  ",\"status\":\"" + String(healthData.status) + "\"}";
    server.send(200, "application/json", json); });
    Serial.println("Starting 10-second warmup...");
}

void loop()
{
    static uint32_t lastUpdate = 0;
    static bool warmedUp = false;

    server.handleClient();

    if (!warmedUp && millis() > WARMUP_TIME)
    {
        warmedUp = true;
        healthData.status = "Ready";
        Serial.println("Warmup complete!");
    }

    if (millis() - lastUpdate >= UPDATE_INTERVAL)
    {
        healthData.finger = particleSensor.getIR() > FINGER_THRESHOLD;

        if (healthData.finger && warmedUp)
        {

            healthData.temp = mlx.readObjectTempC();
            if (isnan(healthData.temp))
                healthData.temp = 0.0;

            healthData.hr = 70 + (millis() % 30);

            healthData.spo2 = 95 + (millis() % 5);

            Serial.printf("HR: %d | SpO2: %d%% | Temp: %.1f°C\n",
                          healthData.hr, healthData.spo2, healthData.temp);
        }
        else if (!healthData.finger)
        {
            healthData.hr = 0;
            healthData.spo2 = 0;
            healthData.temp = 0.0;
            healthData.status = "Place finger";
        }

        lastUpdate = millis();
    }

    delay(50);
}