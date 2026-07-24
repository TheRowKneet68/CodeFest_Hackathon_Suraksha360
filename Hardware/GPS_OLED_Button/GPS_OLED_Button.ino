#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define OLED_SCL D1
#define OLED_SDA D2
#define GPS_RX_PIN D5
#define GPS_TX_PIN D6
#define BUTTON_PIN D7

// NEO-M8N TX -> NodeMCU D5
// NodeMCU D6 -> NEO-M8N RX (only needed if sending GPS commands)
// Button -> D7 and GND

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);
TinyGPSPlus gps;

unsigned long lastDisplayUpdate = 0;
const unsigned long DISPLAY_INTERVAL_MS = 500;

void showGpsData() {
  const bool buttonPressed = digitalRead(BUTTON_PIN) == LOW;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("GPS LOCATION");

  if (gps.location.isValid()) {
    display.setCursor(0, 13);
    display.print("Lat: ");
    display.println(gps.location.lat(), 6);
    display.setCursor(0, 25);
    display.print("Lon: ");
    display.println(gps.location.lng(), 6);
  } else {
    display.setCursor(0, 18);
    display.println("Waiting for GPS fix");
    display.setCursor(0, 30);
    display.println("Move near open sky");
  }

  display.setCursor(0, 43);
  display.print("Satellites: ");
  if (gps.satellites.isValid()) {
    display.println(gps.satellites.value());
  } else {
    display.println("0");
  }

  display.setCursor(0, 55);
  display.println(buttonPressed ? "Button: PRESSED" : "Button: READY");
  display.display();
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (true) {
      delay(1000);
    }
  }

  gpsSerial.begin(9600);
  showGpsData();
}

void loop() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (millis() - lastDisplayUpdate >= DISPLAY_INTERVAL_MS) {
    showGpsData();
    lastDisplayUpdate = millis();
  }
}
