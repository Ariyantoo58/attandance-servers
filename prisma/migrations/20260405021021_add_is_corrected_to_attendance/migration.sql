-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "clockIn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOut" DATETIME,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "clockInLocation" TEXT,
    "clockInLat" REAL,
    "clockInLng" REAL,
    "clockOutLocation" TEXT,
    "clockOutLat" REAL,
    "clockOutLng" REAL,
    "deviceInfo" TEXT,
    "isCorrected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("clockIn", "clockInLat", "clockInLng", "clockInLocation", "clockOut", "clockOutLat", "clockOutLng", "clockOutLocation", "createdAt", "date", "deviceInfo", "employeeId", "id", "status", "updatedAt") SELECT "clockIn", "clockInLat", "clockInLng", "clockInLocation", "clockOut", "clockOutLat", "clockOutLng", "clockOutLocation", "createdAt", "date", "deviceInfo", "employeeId", "id", "status", "updatedAt" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
