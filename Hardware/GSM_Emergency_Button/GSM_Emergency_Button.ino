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
// Replace this with the phone number that should receive the alert.
const char EMERGENCY_NUMBER[] = "+9779800000000";
const char EMERGENCY_MESSAGE[] = "EMERGENCY: Button pressed. Immediate assistance needed.";

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool alertSent = false;

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

bool sendCommand(const char *command, unsigned long waitMs) {
  Serial.println(command);
  delay(waitMs);
  return true;
}

bool sendEmergencySms() {
  sendCommand("AT", 1000);
  sendCommand("AT+CMGF=1", 1000);

  Serial.print("AT+CMGS=\"");
  Serial.print(EMERGENCY_NUMBER);
  Serial.println("\"");
  delay(1000);

  Serial.print(EMERGENCY_MESSAGE);
  Serial.write(26); // Ctrl+Z sends the SMS.
  delay(5000);
  return true;
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
  showScreen("READY", "Waiting for button");
}

void loop() {
  const bool pressed = digitalRead(BUTTON_PIN) == LOW;

  if (pressed && !alertSent) {
    showScreen("EMERGENCY", "Sending SMS...");
    sendEmergencySms();
    alertSent = true;
    showScreen("EMERGENCY", "SMS sent");
  } else if (!pressed && alertSent) {
    alertSent = false;
    showScreen("READY", "Waiting for button");
  }

  delay(50);
}
