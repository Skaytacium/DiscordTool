#include <CapacitiveSensor.h>
#define _number 4
#define _threshold 3500
unsigned long tau[_number];
CapacitiveSensor sensors[_number] = {
    CapacitiveSensor(2, 3),
    CapacitiveSensor(2, 4),
    CapacitiveSensor(2, 5),
    CapacitiveSensor(2, 6)
};
void setup() {
    Serial.begin(38400);
    for (byte i = 0; i < _number; i++) sensors[i].reset_CS_AutoCal();
}
void loop() {
    for (byte i = 0; i < _number; i++) {
        tau[i] = sensors[i].capacitiveSensor(20);
        Serial.print(i);
        Serial.print(":");
        Serial.println(tau[i]);
    }
}