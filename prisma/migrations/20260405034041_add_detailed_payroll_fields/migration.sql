/*
  Warnings:

  - You are about to drop the column `deductions` on the `Payroll` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basicSalary" REAL NOT NULL,
    "overtime" REAL NOT NULL DEFAULT 0,
    "bonuses" REAL NOT NULL DEFAULT 0,
    "pph21" REAL NOT NULL DEFAULT 0,
    "bpjsKetenagakerjaan" REAL NOT NULL DEFAULT 0,
    "bpjsKesehatan" REAL NOT NULL DEFAULT 0,
    "lateDeduction" REAL NOT NULL DEFAULT 0,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "netSalary" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATETIME,
    "payslipUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payroll" ("basicSalary", "bonuses", "createdAt", "employeeId", "id", "month", "netSalary", "paymentDate", "payslipUrl", "status", "updatedAt", "year") SELECT "basicSalary", "bonuses", "createdAt", "employeeId", "id", "month", "netSalary", "paymentDate", "payslipUrl", "status", "updatedAt", "year" FROM "Payroll";
DROP TABLE "Payroll";
ALTER TABLE "new_Payroll" RENAME TO "Payroll";
CREATE UNIQUE INDEX "Payroll_employeeId_month_year_key" ON "Payroll"("employeeId", "month", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
