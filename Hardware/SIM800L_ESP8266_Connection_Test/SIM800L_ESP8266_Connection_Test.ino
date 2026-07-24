#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define OLED_SCL D1
#define OLED_SDA D2
#define BUTTON_PIN D7

// Hardware UART wiring:
// SIM800L TX -> NodeMCU RX (GPIO3)
// NodeMCU TX (GPIO1) -> 1k resistor -> SIM800L RX
// SIM800L RX -> 2k resistor -> GND
const unsigned long SIM800L_BAUD_RATE = 9600;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool buttonWasPressed = false;

void showStatus(const char *title, const char *message) {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 10);
  display.println(title);
  display.setTextSize(1);
  display.setCursor(0, 44);
  display.println(message);
  display.display();
}

String sendCommand(const char *command, unsigned long timeoutMs) {
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

bool registeredOnNetwork(const String &response) {
  return response.indexOf(",1") >= 0 || response.indexOf(",5") >= 0;
}

int readSignalStrength(const String &response) {
  const int marker = response.indexOf("+CSQ: ");
  if (marker < 0) {
    return -1;
  }

  const int start = marker + 6;
  const int end = response.indexOf(',', start);
  if (end < start) {
    return -1;
  }

  return response.substring(start, end).toInt();
}

void testSim800l() {
  showStatus("SIM800L", "Testing AT...");
  const String atResponse = sendCommand("AT", 2000);
  if (atResponse.indexOf("OK") < 0) {
    showStatus("ERROR", "No AT response");
    return;
  }

  showStatus("SIM800L", "AT: OK");
  delay(1000);

  const String simResponse = sendCommand("AT+CPIN?", 1500);
  if (simResponse.indexOf("READY") < 0) {
    showStatus("SIM800L", "SIM not ready");
    return;
  }

  showStatus("SIM800L", "SIM: READY");
  delay(1000);

  const String networkResponse = sendCommand("AT+CREG?", 1500);
  if (!registeredOnNetwork(networkResponse)) {
    showStatus("SIM800L", "Network waiting");
    return;
  }

  const String signalResponse = sendCommand("AT+CSQ", 1500);
  const int signal = readSignalStrength(signalResponse);
  String result = "Network: OK";
  if (signal >= 0 && signal != 99) {
    result += " Sig:";
    result += signal;
  }
  showStatus("SIM800L", result.c_str());
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (true) {
      delay(1000);
    }
  }

  // GPIO1 is TX and GPIO3 is RX on the NodeMCU hardware UART.
  Serial.begin(SIM800L_BAUD_RATE);
  delay(3000); // Allow the SIM800L to finish starting.
  testSim800l();
}

void loop() {
  const bool buttonPressed = digitalRead(BUTTON_PIN) == LOW;
  if (buttonPressed && !buttonWasPressed) {
    testSim800l();
  }
  buttonWasPressed = buttonPressed;
  delay(50);
}
