#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define BUTTON_PIN D7
#define OLED_SCL D1
#define OLED_SDA D2

// ESP8266 TX -> SIM RX and ESP8266 RX <- SIM TX.
// This version only checks GSM status; it does not send an SMS.

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool buttonWasPressed = false;
unsigned long lastGsmCheck = 0;
const unsigned long GSM_CHECK_INTERVAL = 10000;

void showScreen(const char *line1, const char *line2 = "") {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 12);
  display.println(line1);
  display.setTextSize(1);
  display.setCursor(0, 44);
  display.println(line2);
  display.display();
}

String sendAtCommand(const char *command, unsigned long timeoutMs) {
  while (Serial.available()) {
    Serial.read();
  }

  Serial.println(command);
  String response;
  const unsigned long startedAt = millis();

  while (millis() - startedAt < timeoutMs) {
    while (Serial.available()) {
      response += static_cast<char>(Serial.read());
    }
    yield();
  }

  return response;
}

bool isRegistered(const String &response) {
  return response.indexOf(",1") >= 0 || response.indexOf(",5") >= 0;
}

int signalStrength(const String &response) {
  const int marker = response.indexOf("+CSQ: ");
  if (marker < 0) {
    return -1;
  }

  const int valueStart = marker + 6;
  const int valueEnd = response.indexOf(',', valueStart);
  return response.substring(valueStart, valueEnd).toInt();
}

void checkGsm() {
  showScreen("GSM CHECK", "Contacting module...");
  const String atResponse = sendAtCommand("AT", 1500);

  if (atResponse.indexOf("OK") < 0) {
    showScreen("GSM ERROR", "No AT response");
    return;
  }

  const String networkResponse = sendAtCommand("AT+CREG?", 1500);
  const String signalResponse = sendAtCommand("AT+CSQ", 1500);
  const bool registered = isRegistered(networkResponse);
  const int signal = signalStrength(signalResponse);

  if (!registered) {
    showScreen("GSM READY", "Network: waiting");
    return;
  }

  String status = "Network OK";
  if (signal >= 0 && signal != 99) {
    status += "  Sig: ";
    status += signal;
  }
  showScreen("GSM READY", status.c_str());
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // D2 is SDA and D1 is SCL for the OLED.
  Wire.begin(OLED_SDA, OLED_SCL);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (true) {
      delay(1000);
    }
  }

  // Serial uses the ESP8266 hardware UART: TX=GPIO1, RX=GPIO3.
  Serial.begin(9600);
  delay(1000);
  checkGsm();
  lastGsmCheck = millis();
}

void loop() {
  const bool pressed = digitalRead(BUTTON_PIN) == LOW;

  if (pressed && !buttonWasPressed) {
    checkGsm();
    lastGsmCheck = millis();
  }
  buttonWasPressed = pressed;

  if (millis() - lastGsmCheck >= GSM_CHECK_INTERVAL) {
    checkGsm();
    lastGsmCheck = millis();
  }

  delay(50);
}
