#include <LiquidCrystal.h>

// ---------------- LCD ----------------
// RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 7, 6);

// ---------------- PINS ----------------
const int BTN_CRY  = 2;
const int BTN_RAND = 3;

const int LED_RED  = 8;
const int LED_BLUE = 9;

const int BUZZER   = 10;

const int JOY_X = A0;
const int JOY_Y = A1;

// ---------------- JOYSTICK THRESHOLDS ----------------
const int LOW_T  = 200;
const int HIGH_T = 800;

unsigned long lastJoySend = 0;
const unsigned long JOY_COOLDOWN = 220;

// ---------------- BUTTON STATE ----------------
bool lastCryState  = HIGH;
bool lastRandState = HIGH;

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(BTN_CRY, INPUT_PULLUP);
  pinMode(BTN_RAND, INPUT_PULLUP);

  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  lcd.begin(16, 2);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("POKEDEX READY");
  lcd.setCursor(0, 1);
  lcd.print("Connect Site");
}

// ---------------- LED + BUZZER ----------------
void blinkRedOnce() {
  digitalWrite(LED_RED, HIGH);
  delay(120);
  digitalWrite(LED_RED, LOW);
}

void blinkBlueOnce() {
  digitalWrite(LED_BLUE, HIGH);
  delay(120);
  digitalWrite(LED_BLUE, LOW);
}

void blinkBothTwice() {
  for (int i = 0; i < 2; i++) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_BLUE, HIGH);
    delay(120);
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_BLUE, LOW);
    delay(120);
  }
}

void beepShort() {
  tone(BUZZER, 1200, 120);
}

// ---------------- LCD SHOW ----------------
void showPokemon(int id, String name) {
  lcd.clear();
  lcd.setCursor(0, 0);

  if (id < 10) lcd.print("00");
  else if (id < 100) lcd.print("0");
  lcd.print(id);

  lcd.print(" ");
  lcd.print(name.substring(0, 9));

  lcd.setCursor(0, 1);
  lcd.print("GEN 1 POKEDEX");
}

// ---------------- HANDLE SERIAL FROM WEB ----------------
void handleLine(String s) {
  s.trim();

  if (s == "PREV") {
    blinkRedOnce();
    return;
  }

  if (s == "NEXT") {
    blinkBlueOnce();
    return;
  }

  if (s == "CRY") {
    blinkBothTwice();
    beepShort();
    return;
  }

  if (s == "RAND") {
    return;
  }

  // Format: SHOW 25 Pikachu
  if (s.startsWith("SHOW ")) {
    int firstSpace = s.indexOf(' ');
    int secondSpace = s.indexOf(' ', firstSpace + 1);

    if (secondSpace == -1) return;

    int id = s.substring(firstSpace + 1, secondSpace).toInt();
    String name = s.substring(secondSpace + 1);

    showPokemon(id, name);
  }
}

// ---------------- BUTTONS ----------------
void handleButtons() {
  bool cryState  = digitalRead(BTN_CRY);
  bool randState = digitalRead(BTN_RAND);

  if (cryState == LOW && lastCryState == HIGH) {
    Serial.println("CRY");
    blinkBothTwice();
    beepShort();
  }

  if (randState == LOW && lastRandState == HIGH) {
    Serial.println("RAND");
  }

  lastCryState  = cryState;
  lastRandState = randState;
}

// ---------------- JOYSTICK ----------------
void handleJoystick() {
  unsigned long now = millis();
  if (now - lastJoySend < JOY_COOLDOWN) return;

  int x = analogRead(JOY_X);
  int y = analogRead(JOY_Y);

  // YOUR mapping:
  // LEFT  = y low
  // RIGHT = y high
  // UP    = x high
  // DOWN  = x low

  if (x > HIGH_T || y < LOW_T) {
    Serial.println("PREV");
    blinkRedOnce();
    lastJoySend = now;
  }
  else if (x < LOW_T || y > HIGH_T) {
    Serial.println("NEXT");
    blinkBlueOnce();
    lastJoySend = now;
  }
}

// ---------------- SERIAL READ ----------------
void readSerial() {
  static String line = "";

  while (Serial.available()) {
    char c = Serial.read();

    if (c == '\n') {
      handleLine(line);
      line = "";
    } else {
      line += c;
    }
  }
}

// ---------------- LOOP ----------------
void loop() {
  handleButtons();
  handleJoystick();
  readSerial();
}