#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define OLED_SCL D1
#define OLED_SDA D2
#define BUTTON_PIN D0

// UART0 is swapped after boot, so the GSM pins are:
// SIM800L TX -> NodeMCU D7 (GPIO13)
// NodeMCU D8 (GPIO15) -> 1k resistor -> SIM800L RX
// SIM800L RX -> 2k resistor -> GND
const unsigned long SIM800L_BAUD_RATE = 9600;
const char OWNER_NUMBER[] = "+9779829117277";
const char HELLO_MESSAGE[] = "Hello from ESP8266 SIM800L";

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

void clearSerialInput() {
  while (Serial.available()) {
    Serial.read();
  }
}

String readResponse(unsigned long timeoutMs) {
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

String sendCommand(const char *command, unsigned long timeoutMs) {
  clearSerialInput();
  Serial.println(command);
  return readResponse(timeoutMs);
}

bool initModule(const char *command, const char *expected, unsigned long timeoutMs) {
  const String response = sendCommand(command, timeoutMs);
  return response.indexOf(expected) >= 0;
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

bool sendHelloSms() {
  String smsCommand = "AT+CMGS=\"";
  smsCommand += OWNER_NUMBER;
  smsCommand += "\"";

  const String prompt = sendCommand(smsCommand.c_str(), 3000);
  if (prompt.indexOf('>') < 0) {
    return false;
  }

  clearSerialInput();
  Serial.print(HELLO_MESSAGE);
  Serial.write(26); // Ctrl+Z sends the SMS.
  const String receipt = readResponse(10000);
  return receipt.indexOf("+CMGS:") >= 0 || receipt.indexOf("OK") >= 0;
}

void testSim800l(bool sendHello) {
  showStatus("SIM800L", "Testing AT...");
  if (!initModule("AT", "OK", 2000)) {
    showStatus("ERROR", "No AT response");
    return;
  }

  showStatus("SIM800L", "AT: OK");
  delay(1000);

  if (!initModule("AT+CPIN?", "READY", 1500)) {
    showStatus("SIM800L", "SIM not ready");
    return;
  }

  showStatus("SIM800L", "SIM: READY");
  delay(1000);

  if (!initModule("AT+CMGF=1", "OK", 1500) ||
      !initModule("AT+CNMI=1,2,0,0,0", "OK", 1500)) {
    showStatus("ERROR", "SMS setup failed");
    return;
  }

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

  if (sendHello) {
    delay(1000);
    showStatus("SIM800L", "Sending hello...");
    if (sendHelloSms()) {
      showStatus("SIM800L", "Hello SMS sent");
    } else {
      showStatus("ERROR", "SMS send failed");
    }
  }
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (true) {
      delay(1000);
    }
  }

  Serial.begin(SIM800L_BAUD_RATE);
  Serial.swap(); // Move UART0 RX/TX from GPIO3/GPIO1 to GPIO13/GPIO15.
  delay(3000); // Allow the SIM800L to finish starting.
  testSim800l(true);
}

void loop() {
  const bool buttonPressed = digitalRead(BUTTON_PIN) == LOW;
  if (buttonPressed && !buttonWasPressed) {
    testSim800l(false);
  }
  buttonWasPressed = buttonPressed;
  delay(50);
}
